// Shared test doubles. No criterion keys here on purpose.
import { AuditLog } from '../src/audit.ts'
import { DuplicateRegistry } from '../src/duplicates.ts'
import { type FinanceApi, FinanceGateway } from '../src/finance.ts'
import type { Actor, Order } from '../src/types.ts'

export const coordinator: Actor = { id: 'coord-1', role: 'coordinator' }
export const support: Actor = { id: 'support-1', role: 'support' }

export const fixedClock = () => new Date('2026-11-11T09:00:00.000Z')

export function completeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'BEA-1001',
    customerId: 'CUST-17',
    poNumber: 'PO-5512',
    deliveryDate: '2026-12-01',
    lines: [{ sku: 'SKU-9', quantity: 3 }],
    ...overrides,
  }
}

export type FakeMode = 'ok' | 'fail' | 'hang'

/** A finance API that records every call and can be told to fail or hang. */
export function fakeFinance(initial: FakeMode = 'ok') {
  const calls: { orderId: string; idempotencyKey: string }[] = []
  let mode: FakeMode = initial
  const api: FinanceApi = {
    async enqueue(input) {
      calls.push(input)
      if (mode === 'fail') throw new Error('finance_api_unavailable')
      if (mode === 'hang') return new Promise(() => {})
      return { entryId: `FIN-${calls.length}` }
    },
  }
  return {
    api,
    calls,
    setMode(next: FakeMode) {
      mode = next
    },
  }
}

export function deps(finance = fakeFinance(), timeoutMs = 50) {
  return {
    finance: new FinanceGateway(finance.api, fixedClock, timeoutMs),
    duplicates: new DuplicateRegistry(fixedClock),
    audit: new AuditLog(),
    clock: fixedClock,
  }
}
