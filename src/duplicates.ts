// STORY-002 Identify duplicate submissions and idempotency key (traces to FR-002).
import { createHash } from 'node:crypto'
import type { Clock, Order } from './types.ts'

/** The same order always gets the same key, however often it is submitted. */
export function stableOrderKey(order: Order): string {
  const lines = [...(order.lines ?? [])]
    .map((line) => `${line.sku}:${line.quantity}`)
    .sort()
    .join(',')
  const basis = [order.customerId ?? '', order.poNumber ?? '', lines].join('|')
  return `ord_${createHash('sha256').update(basis).digest('hex').slice(0, 24)}`
}

export interface DuplicateCheck {
  key: string
  suspectedDuplicate: boolean
  /** Why the order is held, shown with the key. Null when it may proceed. */
  reason: string | null
  /** True while finance enqueue must wait for a person to review. */
  financeHold: boolean
  followUp: string | null
}

export class DuplicateRegistry {
  #firstSeen = new Map<string, string>()
  #cleared = new Set<string>()
  #clock: Clock

  constructor(clock: Clock) {
    this.#clock = clock
  }

  check(order: Order): DuplicateCheck {
    let key: string
    try {
      key = stableOrderKey(order)
    } catch {
      return {
        key: 'unavailable',
        suspectedDuplicate: true,
        reason: 'duplicate_rule_could_not_be_evaluated',
        financeHold: true,
        followUp: 'Escalate to an order coordinator before finance enqueue.',
      }
    }
    const seen = this.#firstSeen.get(key)
    if (seen === undefined) {
      this.#firstSeen.set(key, this.#clock().toISOString())
      return { key, suspectedDuplicate: false, reason: null, financeHold: false, followUp: null }
    }
    if (this.#cleared.has(key)) {
      return { key, suspectedDuplicate: false, reason: null, financeHold: false, followUp: null }
    }
    return {
      key,
      suspectedDuplicate: true,
      reason: `same_order_first_seen_${seen}`,
      financeHold: true,
      followUp: 'Review the suspected duplicate, then clear it or escalate.',
    }
  }

  /** A person clears a flag raised in error; the key stays the same. */
  clear(key: string): void {
    this.#cleared.add(key)
  }
}
