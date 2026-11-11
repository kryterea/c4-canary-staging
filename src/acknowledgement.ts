// STORY-004 Confirm import and control acknowledgement (traces to FR-004).
import type { Actor, Clock, OrderRecord } from './types.ts'

/** The acknowledgement control a coordinator sees on an order. */
export function acknowledgementControl(_record: OrderRecord): {
  enabled: boolean
  guidance: string
} {
  return { enabled: true, guidance: 'Acknowledge the order once you have checked it.' }
}

/** A coordinator acknowledges the order, which marks it accepted. */
export function acknowledge(record: OrderRecord, actor: Actor, clock: Clock): OrderRecord {
  return {
    ...record,
    acknowledged: true,
    importStatus: 'accepted',
    history: [
      ...record.history,
      {
        at: clock().toISOString(),
        step: 'acknowledgement',
        outcome: 'accepted',
        actorId: actor.id,
      },
    ],
  }
}
