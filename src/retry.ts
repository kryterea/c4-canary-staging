// STORY-006 Retry failed finance import, Coordinator requested (traces to FR-006).
import type { AuditLog } from './audit.ts'
import type { EnqueueResult, FinanceGateway } from './finance.ts'
import type { Actor, Clock, OrderRecord } from './types.ts'

export type RetryOutcome =
  | { allowed: true; result: EnqueueResult; record: OrderRecord }
  | { allowed: false; reason: string; guidance: string }

/**
 * Only a coordinator may retry, only a failed or timed-out import, and only with the
 * order's original idempotency key. A retry never marks the order accepted; only a
 * finance confirmation does.
 */
export async function requestRetry(
  record: OrderRecord,
  actor: Actor,
  gateway: FinanceGateway,
  audit: AuditLog,
  clock: Clock,
): Promise<RetryOutcome> {
  const at = clock().toISOString()
  if (actor.role !== 'coordinator') {
    audit.record({
      orderId: record.orderId,
      step: 'retry',
      outcome: 'denied',
      actorId: actor.id,
      at,
    })
    return {
      allowed: false,
      reason: 'retry_coordinator_only',
      guidance: 'Only a coordinator can retry a finance import. Escalate to one.',
    }
  }
  if (record.importStatus === 'pending' || record.importStatus === 'unknown') {
    audit.record({
      orderId: record.orderId,
      step: 'retry',
      outcome: 'disabled_unsettled',
      actorId: actor.id,
      at,
    })
    return {
      allowed: false,
      reason: 'import_not_settled',
      guidance: 'The import has not settled. Check its status or escalate; do not retry blind.',
    }
  }
  if (record.importStatus !== 'failed' && record.importStatus !== 'timeout') {
    return {
      allowed: false,
      reason: 'nothing_to_retry',
      guidance: 'Only a failed or timed-out import can be retried.',
    }
  }
  const result = await gateway.resend(record.orderId, record.key)
  audit.record({
    orderId: record.orderId,
    step: 'retry',
    outcome: result.status,
    actorId: actor.id,
    at,
  })
  const next: OrderRecord = {
    ...record,
    importStatus: result.status === 'enqueued' ? 'pending' : result.status,
    history: [...record.history, { at, step: 'retry', outcome: result.status, actorId: actor.id }],
  }
  return { allowed: true, result, record: next }
}
