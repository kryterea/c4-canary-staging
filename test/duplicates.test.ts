import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DuplicateRegistry, stableOrderKey } from '../src/duplicates.ts'
import { submitOrder } from '../src/intake.ts'
import { completeOrder, coordinator, deps, fakeFinance, fixedClock } from './helpers.ts'

describe('STORY-002 / FR-002 duplicate submissions and idempotency key', () => {
  it('STORY-002: flags a suspected duplicate before finance enqueue with the stable key shown', async () => {
    const finance = fakeFinance()
    const d = deps(finance)
    await submitOrder(completeOrder(), coordinator, d)
    const second = await submitOrder(completeOrder({ orderId: 'BEA-1002' }), coordinator, d)
    assert.equal(second.stage, 'held')
    assert.equal(second.stage === 'held' && second.key, stableOrderKey(completeOrder()))
    assert.equal(finance.calls.length, 1)
  })

  it('STORY-002: keeps the same stable key when the same order is submitted again', () => {
    const registry = new DuplicateRegistry(fixedClock)
    const first = registry.check(completeOrder())
    const again = registry.check(completeOrder())
    assert.equal(again.key, first.key)
  })

  it('STORY-002: keeps the flag, key and reason visible with a follow-up until cleared', () => {
    const registry = new DuplicateRegistry(fixedClock)
    registry.check(completeOrder())
    const flagged = registry.check(completeOrder())
    assert.equal(flagged.financeHold, true)
    assert.ok(flagged.reason)
    assert.ok(flagged.followUp)
    registry.clear(flagged.key)
    assert.equal(registry.check(completeOrder()).financeHold, false)
  })
})
