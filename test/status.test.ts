import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { viewStatus } from '../src/status.ts'
import type { OrderRecord } from '../src/types.ts'
import { coordinator, support } from './helpers.ts'

const record: OrderRecord = {
  orderId: 'BEA-1001',
  key: 'ord_test',
  importStatus: 'pending',
  financeConfirmed: false,
  acknowledged: false,
  history: [
    { at: '2026-11-11T09:00:00.000Z', step: 'validation', outcome: 'passed', actorId: 'coord-1' },
    { at: '2026-11-11T09:00:00.000Z', step: 'duplicate', outcome: 'clear', actorId: 'coord-1' },
    { at: '2026-11-11T09:00:00.000Z', step: 'enqueue', outcome: 'enqueued', actorId: 'coord-1' },
  ],
}

describe('STORY-005 / FR-005 view order status', () => {
  it('STORY-005: shows a coordinator or support the full state history', () => {
    for (const actor of [coordinator, support]) {
      const view = viewStatus(record, actor)
      assert.deepEqual(
        view.history.map((event) => event.step),
        ['validation', 'duplicate', 'enqueue'],
      )
    }
  })

  it('STORY-005: shows pending or unknown status with guidance to check or escalate', () => {
    assert.match(viewStatus(record, coordinator).guidance ?? '', /escalate/)
    const unknown = viewStatus({ ...record, importStatus: 'unknown' }, support)
    assert.match(unknown.guidance ?? '', /escalate/)
  })
})
