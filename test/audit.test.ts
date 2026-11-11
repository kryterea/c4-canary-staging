import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AuditLog } from '../src/audit.ts'
import { submitOrder } from '../src/intake.ts'
import { requestRetry } from '../src/retry.ts'
import { completeOrder, coordinator, deps, fixedClock, support } from './helpers.ts'

describe('STORY-007 / FR-007 audit trail', () => {
  it('STORY-007: shows who did what and when for each intake step', async () => {
    const d = deps()
    await submitOrder(completeOrder(), coordinator, d)
    const trail = d.audit.list('BEA-1001')
    assert.deepEqual(
      trail.map((event) => event.step),
      ['validation', 'duplicate', 'enqueue'],
    )
    for (const event of trail) {
      assert.equal(event.actorId, 'coord-1')
      assert.equal(event.at, '2026-11-11T09:00:00.000Z')
    }
  })

  it('STORY-007: records a retry denial with actor and time', async () => {
    const d = deps()
    const audit = new AuditLog()
    await requestRetry(
      {
        orderId: 'BEA-1001',
        key: 'ord_stable',
        importStatus: 'failed',
        financeConfirmed: false,
        acknowledged: false,
        history: [],
      },
      support,
      d.finance,
      audit,
      fixedClock,
    )
    assert.deepEqual(audit.list('BEA-1001')[0], {
      orderId: 'BEA-1001',
      step: 'retry',
      outcome: 'denied',
      actorId: 'support-1',
      at: '2026-11-11T09:00:00.000Z',
    })
  })

  it('STORY-007: flags missing audit coverage and a failed recording with a follow-up', () => {
    const audit = new AuditLog()
    const stored = audit.record({
      orderId: 'BEA-1001',
      step: 'enqueue',
      outcome: 'enqueued',
      actorId: '',
      at: '2026-11-11T09:00:00.000Z',
    })
    assert.equal(stored, false)
    const gap = audit.coverage('BEA-1001', ['validation', 'enqueue'])
    assert.deepEqual(gap?.missing, ['validation', 'enqueue'])
    assert.ok(gap?.followUp)
  })
})
