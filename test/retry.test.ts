import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AuditLog } from '../src/audit.ts'
import { FinanceGateway } from '../src/finance.ts'
import { requestRetry } from '../src/retry.ts'
import type { OrderRecord } from '../src/types.ts'
import { coordinator, fakeFinance, fixedClock, support } from './helpers.ts'

function failedRecord(importStatus: OrderRecord['importStatus'] = 'failed'): OrderRecord {
  return {
    orderId: 'BEA-1001',
    key: 'ord_stable',
    importStatus,
    financeConfirmed: false,
    acknowledged: false,
    history: [],
  }
}

async function failedGateway() {
  const finance = fakeFinance('fail')
  const gateway = new FinanceGateway(finance.api, fixedClock, 50)
  await gateway.enqueueOnce('BEA-1001', 'ord_stable')
  finance.setMode('ok')
  return { finance, gateway }
}

describe('STORY-006 / FR-006 coordinator retry of a failed finance import', () => {
  it('STORY-006: reuses the original key when a coordinator retries a failed import', async () => {
    const { finance, gateway } = await failedGateway()
    const outcome = await requestRetry(
      failedRecord(),
      coordinator,
      gateway,
      new AuditLog(),
      fixedClock,
    )
    assert.equal(outcome.allowed, true)
    assert.deepEqual(
      finance.calls.map((call) => call.idempotencyKey),
      ['ord_stable', 'ord_stable'],
    )
  })

  it('STORY-006: disables retry while the import is pending or unknown', async () => {
    const { finance, gateway } = await failedGateway()
    for (const status of ['pending', 'unknown'] as const) {
      const outcome = await requestRetry(
        failedRecord(status),
        coordinator,
        gateway,
        new AuditLog(),
        fixedClock,
      )
      assert.equal(outcome.allowed, false)
      assert.match(!outcome.allowed ? outcome.guidance : '', /escalate/)
    }
    assert.equal(finance.calls.length, 1)
  })

  it('STORY-006: never marks the order accepted on a retry request alone', async () => {
    const { gateway } = await failedGateway()
    const outcome = await requestRetry(
      failedRecord(),
      coordinator,
      gateway,
      new AuditLog(),
      fixedClock,
    )
    assert.notEqual(outcome.allowed && outcome.record.importStatus, 'accepted')
  })

  it('STORY-006: keeps a failed result visible with reason, key and time', async () => {
    const { gateway } = await failedGateway()
    const kept = gateway.result('ord_stable')
    assert.equal(kept?.status, 'failed')
    assert.ok(kept && 'reason' in kept && kept.reason && kept.followUp)
    assert.equal(kept?.key, 'ord_stable')
    assert.equal(kept?.at, '2026-11-11T09:00:00.000Z')
  })

  it('STORY-006: denies and audits a retry by support, with no finance call', async () => {
    const { finance, gateway } = await failedGateway()
    const audit = new AuditLog()
    const outcome = await requestRetry(failedRecord(), support, gateway, audit, fixedClock)
    assert.equal(outcome.allowed, false)
    assert.equal(finance.calls.length, 1)
    assert.deepEqual(
      audit.list('BEA-1001').map((event) => [event.outcome, event.actorId]),
      [['denied', 'support-1']],
    )
  })
})
