// STORY-003 Idempotent finance API enqueue (traces to FR-003).
import type { Clock } from './types.ts'

export interface FinanceApi {
  enqueue(input: { orderId: string; idempotencyKey: string }): Promise<{ entryId: string }>
}

export type EnqueueResult =
  | { status: 'enqueued'; key: string; entryId: string; at: string }
  | { status: 'failed' | 'timeout'; key: string; reason: string; at: string; followUp: string }

const FOLLOW_UP = 'Check the import status, then ask a coordinator to retry or escalate.'

/**
 * Sends each idempotency key to the finance API once. A repeat with the same key gets
 * the first result back and never creates a second finance entry. A failure or timeout
 * is kept with its reason, key and time.
 */
export class FinanceGateway {
  #api: FinanceApi
  #clock: Clock
  #timeoutMs: number
  #results = new Map<string, EnqueueResult>()

  constructor(api: FinanceApi, clock: Clock, timeoutMs = 5000) {
    this.#api = api
    this.#clock = clock
    this.#timeoutMs = timeoutMs
  }

  result(key: string): EnqueueResult | undefined {
    return this.#results.get(key)
  }

  async enqueueOnce(orderId: string, key: string): Promise<EnqueueResult> {
    const earlier = this.#results.get(key)
    if (earlier) return earlier
    return this.#send(orderId, key)
  }

  /** Sends a failed or timed-out key again, with the same key. Anything else is refused. */
  async resend(orderId: string, key: string): Promise<EnqueueResult> {
    const earlier = this.#results.get(key)
    if (!earlier || earlier.status === 'enqueued') {
      throw new Error('only a failed or timed-out enqueue can be sent again')
    }
    return this.#send(orderId, key)
  }

  async #send(orderId: string, key: string): Promise<EnqueueResult> {
    const at = this.#clock().toISOString()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), this.#timeoutMs)
    })
    let result: EnqueueResult
    try {
      const outcome = await Promise.race([
        this.#api.enqueue({ orderId, idempotencyKey: key }),
        timeout,
      ])
      result =
        outcome === 'timeout'
          ? { status: 'timeout', key, reason: 'finance_api_timeout', at, followUp: FOLLOW_UP }
          : { status: 'enqueued', key, entryId: outcome.entryId, at }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'finance_api_error'
      result = { status: 'failed', key, reason, at, followUp: FOLLOW_UP }
    } finally {
      clearTimeout(timer)
    }
    this.#results.set(key, result)
    return result
  }
}
