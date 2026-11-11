// Beacon order intake: validation, duplicate check, then one finance enqueue.
import type { AuditLog } from './audit.ts'
import type { DuplicateRegistry } from './duplicates.ts'
import type { FinanceGateway } from './finance.ts'
import type { Actor, Clock, Order, OrderRecord, StateEvent } from './types.ts'
import { validateOrder } from './validation.ts'

export interface IntakeDeps {
  duplicates: DuplicateRegistry
  finance: FinanceGateway
  audit: AuditLog
  clock: Clock
}

export type IntakeOutcome =
  | { stage: 'blocked'; missing: string[]; reason: string }
  | { stage: 'held'; key: string; reason: string; followUp: string | null }
  | { stage: 'sent'; record: OrderRecord }

export async function submitOrder(
  order: Order,
  actor: Actor,
  deps: IntakeDeps,
): Promise<IntakeOutcome> {
  const orderId = order.orderId ?? 'unassigned'
  const at = deps.clock().toISOString()
  const event = (step: StateEvent['step'], outcome: string): StateEvent => ({
    at,
    step,
    outcome,
    actorId: actor.id,
  })
  const log = (step: StateEvent['step'], outcome: string) =>
    deps.audit.record({ orderId, step, outcome, actorId: actor.id, at })

  const validation = validateOrder(order)
  if (!validation.ok) {
    log('validation', validation.reason)
    return { stage: 'blocked', missing: validation.missing, reason: validation.reason }
  }
  log('validation', 'passed')

  const duplicate = deps.duplicates.check(order)
  if (duplicate.financeHold) {
    log('duplicate', duplicate.reason ?? 'held')
    return {
      stage: 'held',
      key: duplicate.key,
      reason: duplicate.reason ?? 'held',
      followUp: duplicate.followUp,
    }
  }
  log('duplicate', 'clear')

  const sent = await deps.finance.enqueueOnce(orderId, duplicate.key)
  log('enqueue', sent.status)
  return {
    stage: 'sent',
    record: {
      orderId,
      key: duplicate.key,
      importStatus: sent.status === 'enqueued' ? 'pending' : sent.status,
      financeConfirmed: false,
      acknowledged: false,
      history: [
        event('validation', 'passed'),
        event('duplicate', 'clear'),
        event('enqueue', sent.status),
      ],
    },
  }
}
