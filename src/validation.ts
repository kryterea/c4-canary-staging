// STORY-001 Validate required fields (traces to FR-001).
import type { Order } from './types.ts'

export const REQUIRED_FIELDS = ['customerId', 'poNumber', 'deliveryDate', 'lines'] as const

export type ValidationResult = { ok: true } | { ok: false; missing: string[]; reason: string }

function present(order: Order, field: (typeof REQUIRED_FIELDS)[number]): boolean {
  const value = order[field]
  if (field === 'lines') return Array.isArray(value) && value.length > 0
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Blocks an order before finance enqueue when a required field is missing, and lists
 * the missing fields. An order that cannot be validated at all stays blocked too.
 */
export function validateOrder(order: unknown): ValidationResult {
  if (order === null || typeof order !== 'object' || Array.isArray(order)) {
    return { ok: false, missing: [...REQUIRED_FIELDS], reason: 'validation_could_not_complete' }
  }
  const missing = REQUIRED_FIELDS.filter((field) => !present(order as Order, field))
  if (missing.length > 0) return { ok: false, missing, reason: 'required_fields_missing' }
  return { ok: true }
}
