import { describe, expect, test } from 'vitest'
import { RETENTION_PERIODS } from '#shared/constants/legal'
import {
  PDF_EXPORT_RETENTION_DAYS,
  PDF_EXPORT_STATUSES,
  pdfExportStatusValues,
} from '#shared/constants/pdf_export'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/pdf_export', () => {
  test('enum cohérent et figé (CHECK pdf_exports.status)', () => {
    expectConsistentEnum(PDF_EXPORT_STATUSES, pdfExportStatusValues, [
      'pending',
      'processing',
      'completed',
      'failed',
    ])
  })

  test('la durée de conservation est un nombre entier de jours positif', () => {
    expect(Number.isInteger(PDF_EXPORT_RETENTION_DAYS)).toBe(true)
    expect(PDF_EXPORT_RETENTION_DAYS).toBeGreaterThan(0)
  })

  test('la durée affichée sur /confidentialite correspond à la purge réelle', () => {
    const pdfRetention = RETENTION_PERIODS.find((period) => /PDF/.test(period.data))
    expect(pdfRetention?.duration).toContain(`${PDF_EXPORT_RETENTION_DAYS} jours`)
  })
})
