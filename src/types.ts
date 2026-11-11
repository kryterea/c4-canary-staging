// Beacon order intake: shared types. Fictional test material for Kryterea assurance.

export type Role = 'coordinator' | 'support' | 'viewer'

export interface Actor {
  id: string
  role: Role
}

export interface OrderLine {
  sku: string
  quantity: number
}

/** An order as submitted. Any field may be missing; validation decides. */
export interface Order {
  orderId?: string
  customerId?: string
  poNumber?: string
  deliveryDate?: string
  lines?: OrderLine[]
}

export type ImportStatus = 'not_sent' | 'pending' | 'unknown' | 'failed' | 'timeout' | 'accepted'

export type Step =
  | 'validation'
  | 'duplicate'
  | 'enqueue'
  | 'confirmation'
  | 'acknowledgement'
  | 'retry'
  | 'access'

export interface StateEvent {
  at: string
  step: Step
  outcome: string
  actorId: string
}

/** What intake knows about one order after submission. */
export interface OrderRecord {
  orderId: string
  key: string
  importStatus: ImportStatus
  financeConfirmed: boolean
  acknowledged: boolean
  history: StateEvent[]
}

export type Clock = () => Date
