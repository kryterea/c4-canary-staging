// STORY-005 View authorized order status (traces to FR-005).
import type { Actor, OrderRecord, StateEvent } from './types.ts'

export interface StatusView {
  orderId: string
  importStatus: OrderRecord['importStatus']
  history: StateEvent[]
  guidance: string | null
}

const UNSETTLED = new Set(['pending', 'unknown'])

/**
 * The full state history of an order, with guidance while its import is pending or
 * unknown.
 */
export function viewStatus(record: OrderRecord, _actor: Actor): StatusView {
  return {
    orderId: record.orderId,
    importStatus: record.importStatus,
    history: [...record.history],
    guidance: UNSETTLED.has(record.importStatus)
      ? 'The finance import has not settled. Check its status or escalate.'
      : null,
  }
}
