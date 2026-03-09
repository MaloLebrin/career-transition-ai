import { BulkJobSchema } from '#database/schema'

export default class BulkJob extends BulkJobSchema { }

export const BULK_JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type BulkJobStatus = (typeof BULK_JOB_STATUSES)[keyof typeof BULK_JOB_STATUSES]

export const BULK_JOB_TYPES = {
  EMAILS: 'emails',
  PDFS: 'pdfs',
  MIXED: 'mixed',
} as const

export type BulkJobType = (typeof BULK_JOB_TYPES)[keyof typeof BULK_JOB_TYPES]

export const BULK_JOB_SCOPES = {
  SINGLE: 'single',
  BATCH: 'batch',
  ORG: 'org',
} as const

export type BulkJobScope = (typeof BULK_JOB_SCOPES)[keyof typeof BULK_JOB_SCOPES]
