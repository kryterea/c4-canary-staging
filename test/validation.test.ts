import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { submitOrder } from '../src/intake.ts'
import { validateOrder } from '../src/validation.ts'
import { completeOrder, coordinator, deps, fakeFinance } from './helpers.ts'

describe('STORY-001 / FR-001 validate required fields', () => {
  it('STORY-001: blocks an order with missing fields before finance enqueue and lists them', async () => {
    const finance = fakeFinance()
    const outcome = await submitOrder(
      completeOrder({ poNumber: '', lines: [] }),
      coordinator,
      deps(finance),
    )
    assert.equal(outcome.stage, 'blocked')
    assert.deepEqual(outcome.stage === 'blocked' && outcome.missing, ['poNumber', 'lines'])
    assert.equal(finance.calls.length, 0)
  })

  it('STORY-001: lets a complete order proceed to the next intake step', async () => {
    const outcome = await submitOrder(completeOrder(), coordinator, deps())
    assert.equal(outcome.stage, 'sent')
  })

  it('STORY-001: keeps a resubmitted incomplete order blocked, with the reason shown', async () => {
    const finance = fakeFinance()
    const d = deps(finance)
    await submitOrder(completeOrder({ deliveryDate: undefined }), coordinator, d)
    const again = await submitOrder(completeOrder({ deliveryDate: undefined }), coordinator, d)
    assert.equal(again.stage, 'blocked')
    assert.equal(again.stage === 'blocked' && again.reason, 'required_fields_missing')
    assert.equal(finance.calls.length, 0)
  })

  it('STORY-001: stays blocked when validation cannot complete', () => {
    const result = validateOrder(null)
    assert.equal(result.ok, false)
    assert.equal(!result.ok && result.reason, 'validation_could_not_complete')
  })
})
