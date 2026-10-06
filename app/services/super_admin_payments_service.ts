import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import type User from '#models/user'
import { EntitlementsService } from '#services/entitlements_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import {
  PAYMENTS_PAGE_SIZE,
  paymentStatusValues,
  type PaymentStatus,
} from '#shared/constants/billing'
import type {
  PaymentRow,
  PaymentsListFilter,
  PaymentsListResult,
  RevokePaymentInput,
} from '#shared/types/billing/admin'
import { inject } from '@adonisjs/core'

/**
 * Paiements du forfait vus du super admin (#107) : liste filtrée et paginée,
 * octroi manuel d'un accès (`EntitlementsService.grantManual`, paiement
 * `manual` à 0 €) et révocation (`revoke`, motif consigné). Un remboursement
 * se fait dans Stripe : le webhook (#104) retire l'accès.
 */
@inject()
export class SuperAdminPaymentsService {
  constructor(
    private platformOrganization: PlatformOrganizationService,
    private entitlements: EntitlementsService
  ) {}

  /** Filtre lu depuis la query string : statut connu ou aucun, page ≥ 1. */
  public parseFilter(raw: Record<string, unknown>): PaymentsListFilter {
    const status = paymentStatusValues.includes(raw.status as PaymentStatus)
      ? (raw.status as PaymentStatus)
      : null
    const page = Number.parseInt(String(raw.page ?? '1'), 10)
    return { status, page: Number.isInteger(page) && page > 0 ? page : 1 }
  }

  public async list(filter: PaymentsListFilter): Promise<PaymentsListResult> {
    const paginator = await CandidatePayment.query()
      .if(filter.status, (q) => q.where('status', filter.status!))
      .preload('employee', (q) => q.select('id', 'name', 'email'))
      .preload('grantedBy', (q) => q.select('id', 'name'))
      .preload('revokedBy', (q) => q.select('id', 'name'))
      .orderBy([
        { column: 'createdAt', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .paginate(filter.page, PAYMENTS_PAGE_SIZE)

    return {
      items: paginator.all().map(toRow),
      filter,
      total: paginator.total,
      lastPage: paginator.lastPage,
    }
  }

  /** Octroi manuel : particulier de l'organisation plateforme seulement (404 sinon). */
  public async grant(actor: User, employeeId: number): Promise<CandidatePayment> {
    const platformId = await this.platformOrganization.getId()
    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', platformId)
      .where('accountType', ACCOUNT_TYPES.B2C)
      .whereNull('deletedAt')
      .first()
    if (!employee) throw new CandidateProfileNotFoundError()
    return this.entitlements.grantManual(employee, actor)
  }

  public async revoke(actor: User, input: RevokePaymentInput): Promise<CandidatePayment> {
    return this.entitlements.revoke({ paymentId: input.paymentId, reason: input.reason }, actor)
  }
}

function toRow(payment: CandidatePayment): PaymentRow {
  return {
    id: payment.id,
    candidate: payment.employee
      ? { id: payment.employee.id, name: payment.employee.name, email: payment.employee.email }
      : null,
    provider: payment.provider,
    status: payment.status,
    amountCents: payment.amountCents,
    discountCents: payment.discountCents,
    promoCode: payment.promoCode,
    currency: payment.currency,
    paidAt: payment.paidAt?.toISO() ?? null,
    refundedAt: payment.refundedAt?.toISO() ?? null,
    revokedAt: payment.revokedAt?.toISO() ?? null,
    revokeReason: payment.revokeReason,
    grantedBy: payment.grantedBy
      ? { id: payment.grantedBy.id, name: payment.grantedBy.name }
      : null,
    revokedBy: payment.revokedBy
      ? { id: payment.revokedBy.id, name: payment.revokedBy.name }
      : null,
    createdAt: payment.createdAt?.toISO() ?? null,
    grantsAccess: payment.grantsAccess,
  }
}
