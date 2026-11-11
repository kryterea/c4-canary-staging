// STORY-007 Record audit trail (traces to FR-007).
import type { Step } from './types.ts'

export interface AuditEvent {
  orderId: string
  step: Step
  outcome: string
  actorId: string
  at: string
}

export interface CoverageGap {
  orderId: string
  missing: Step[]
  followUp: string
}

/** Who did what and when, for every intake step, retry, denial and escalation. */
export class AuditLog {
  #events: AuditEvent[] = []
  #failed: { orderId: string; reason: string }[] = []

  /** Records an event. One that cannot be recorded is kept as a gap, never dropped. */
  record(event: AuditEvent): boolean {
    if (!event.actorId || !event.at || !event.orderId) {
      this.#failed.push({ orderId: event.orderId || 'unknown', reason: 'incomplete_event' })
      return false
    }
    this.#events.push({ ...event })
    return true
  }

  list(orderId: string): AuditEvent[] {
    return this.#events.filter((event) => event.orderId === orderId)
  }

  /** Steps an order should have and does not, plus any recording that failed. */
  coverage(orderId: string, expected: Step[]): CoverageGap | null {
    const seen = new Set(this.list(orderId).map((event) => event.step))
    const missing = expected.filter((step) => !seen.has(step))
    const failed = this.#failed.some((item) => item.orderId === orderId)
    if (missing.length === 0 && !failed) return null
    return {
      orderId,
      missing,
      followUp: 'Audit coverage is incomplete. Raise it with support before relying on the trail.',
    }
  }
}
