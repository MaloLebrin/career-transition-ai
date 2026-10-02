import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import {
  BILLING_CURRENCY,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

/** Comptes de démonstration du parcours B2C (épic #90), mot de passe `password`. */
export const B2C_SEED_ACCOUNTS = {
  expert: 'expert.interne@example.fr',
  unpaid: 'particulier.gratuit@example.fr',
  paid: 'particulier.forfait@example.fr',
} as const

/**
 * Parcours B2C de démonstration (#94) : un expert interne, un particulier au
 * parcours gratuit, un particulier au forfait réglé (octroi manuel). Requiert
 * l'organisation plateforme (`AdminSeeder`).
 */
export default class B2cCandidateSeeder extends BaseSeeder {
  async run() {
    const platform = await Organization.findBy('isPlatform', true)
    if (!platform) return

    const expert = await User.updateOrCreate(
      { organizationId: platform.id, email: B2C_SEED_ACCOUNTS.expert },
      {
        organizationId: platform.id,
        email: B2C_SEED_ACCOUNTS.expert,
        password: 'password',
        name: 'Inès Expert',
        role: USERS_ROLES.ADVISOR,
      }
    )

    const unpaid = await this.candidate(platform, {
      email: B2C_SEED_ACCOUNTS.unpaid,
      name: 'Léa Gratuit',
      currentRole: 'Chargée de communication',
      targetRole: 'Responsable marketing',
    })

    const paid = await this.candidate(platform, {
      email: B2C_SEED_ACCOUNTS.paid,
      name: 'Nour Forfait',
      currentRole: 'Développeur web',
      targetRole: 'Product manager',
    })

    const existing = await CandidatePayment.query()
      .where('employeeId', paid.id)
      .where('status', PAYMENT_STATUSES.PAID)
      .first()
    if (!existing) {
      await CandidatePayment.create({
        employeeId: paid.id,
        userId: paid.userId,
        organizationId: platform.id,
        productCode: PAYMENT_PRODUCTS.RESULTS_ACCESS,
        provider: PAYMENT_PROVIDERS.MANUAL,
        status: PAYMENT_STATUSES.PAID,
        amountCents: 0,
        currency: BILLING_CURRENCY,
        paidAt: DateTime.now(),
        grantedByUserId: expert.id,
      })
    }

    void unpaid
  }

  private async candidate(
    platform: Organization,
    data: { email: string; name: string; currentRole: string; targetRole: string }
  ): Promise<Employee> {
    const user = await User.updateOrCreate(
      { organizationId: platform.id, email: data.email },
      {
        organizationId: platform.id,
        email: data.email,
        password: 'password',
        name: data.name,
        role: USERS_ROLES.EMPLOYEE,
        onboardingCompletedAt: DateTime.now(),
      }
    )

    return Employee.updateOrCreate(
      { organizationId: platform.id, email: data.email },
      {
        organizationId: platform.id,
        advisorId: null,
        userId: user.id,
        name: data.name,
        email: data.email,
        currentRole: data.currentRole,
        targetRole: data.targetRole,
        summary: null,
        advisorNotes: null,
        status: EMPLOYEES_STATUS.ACTIVE,
        onboarded: true,
        accountType: ACCOUNT_TYPES.B2C,
      }
    )
  }
}
