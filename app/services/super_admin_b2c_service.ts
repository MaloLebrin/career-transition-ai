import Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import Organization from '#models/organization'
import User from '#models/user'
import { EntitlementsService } from '#services/entitlements_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { BILLING_CURRENCY, PAYMENT_PROVIDERS, PAYMENT_STATUSES } from '#shared/constants/billing'
import { EXPERT_REQUEST_STATUSES } from '#shared/constants/expert_request'
import type { B2cCandidateRow, B2cStats, SuperAdminHomeStats } from '#shared/types/billing/admin'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Particuliers (B2C) vus du super admin (#107). Les listes « organisations »
 * et « utilisateurs » du back-office continuent d'exclure l'organisation
 * plateforme : c'est ici que les particuliers apparaissent.
 */
@inject()
export class SuperAdminB2cService {
  constructor(
    private platformOrganization: PlatformOrganizationService,
    private entitlements: EntitlementsService
  ) {}

  public async listCandidates(): Promise<B2cCandidateRow[]> {
    const platformId = await this.platformOrganization.getId()
    const employees = await Employee.query()
      .where('organizationId', platformId)
      .where('accountType', ACCOUNT_TYPES.B2C)
      .whereNull('deletedAt')
      .preload('user', (q) => q.select('id', 'emailVerifiedAt'))
      .preload('advisor', (q) => q.select('id', 'name'))
      .orderBy('createdAt', 'desc')

    if (employees.length === 0) return []
    const ids = employees.map((e) => e.id)
    const pending = await ExpertRequest.query()
      .whereIn('employeeId', ids)
      .where('status', EXPERT_REQUEST_STATUSES.PENDING)
      .select('employeeId')
    const pendingIds = new Set(pending.map((r) => r.employeeId))

    const rows: B2cCandidateRow[] = []
    for (const employee of employees) {
      const payment = await this.entitlements.findActivePayment(employee.id)
      rows.push({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        emailVerified: Boolean(employee.user?.emailVerifiedAt),
        createdAt: employee.createdAt?.toISO() ?? null,
        hasPaidAccess: payment !== null,
        activePaymentId: payment?.id ?? null,
        expert: employee.advisor ? { id: employee.advisor.id, name: employee.advisor.name } : null,
        pendingExpertRequest: pendingIds.has(employee.id),
      })
    }
    return rows
  }

  public async stats(): Promise<B2cStats> {
    const platformId = await this.platformOrganization.getId()
    const startOfMonth = DateTime.now().startOf('month').toSQL()!

    const [candidates] = await db
      .from('employees')
      .where('organization_id', platformId)
      .where('account_type', ACCOUNT_TYPES.B2C)
      .whereNull('deleted_at')
      .count('* as total')
    const [paid] = await db
      .from('candidate_payments')
      .where('status', PAYMENT_STATUSES.PAID)
      .whereNull('revoked_at')
      .whereNotNull('employee_id')
      .countDistinct('employee_id as total')
    const [revenue] = await db
      .from('candidate_payments')
      .where('status', PAYMENT_STATUSES.PAID)
      .where('provider', PAYMENT_PROVIDERS.STRIPE)
      .where('paid_at', '>=', startOfMonth)
      .sum('amount_cents as total')
    const [pendingRequests] = await db
      .from('expert_requests')
      .where('status', EXPERT_REQUEST_STATUSES.PENDING)
      .count('* as total')

    return {
      candidates: Number(candidates.total),
      paid: Number(paid.total),
      monthRevenueCents: Number(revenue.total ?? 0),
      currency: BILLING_CURRENCY,
      pendingExpertRequests: Number(pendingRequests.total),
    }
  }

  /** Compteurs de l'accueil super admin (anciennement calculés dans le contrôleur). */
  public async homeStats(): Promise<SuperAdminHomeStats> {
    const [organizations] = await Organization.query().count('* as total')
    const [users] = await User.query().count('* as total')
    return {
      organizations: Number(organizations.$extras.total || 0),
      users: Number(users.$extras.total || 0),
      b2c: await this.stats(),
    }
  }
}
