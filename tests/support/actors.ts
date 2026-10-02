import type Employee from '#models/employee'
import type User from '#models/user'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { EmployeeFactory } from '#database/factories/employee_factory'
import { OrganizationFactory } from '#database/factories/organization_factory'
import { UserFactory } from '#database/factories/user_factory'
import Organization from '#models/organization'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { PLATFORM_ORGANIZATION_SLUG } from '#shared/constants/organisation'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { DateTime } from 'luxon'

/**
 * Acteurs prêts à l'emploi pour les suites `functional` et `integration`
 * (repris des `createAdminUser()`… de boat-management).
 *
 * Le rôle est toujours **explicite** : `UserFactory` tire un rôle au hasard, et
 * un test d'accès qui tomberait par chance sur le bon rôle passerait au vert
 * sans rien prouver.
 */

export async function createOrganization(): Promise<Organization> {
  return OrganizationFactory.create()
}

/**
 * Organisation plateforme (#92) : unique (`is_platform`), donc `firstOrCreate`
 * — deux acteurs d'un même test partagent la même. Porte les super admins,
 * les experts internes et les candidats B2C.
 */
export async function createPlatformOrganization(): Promise<Organization> {
  return Organization.firstOrCreate(
    { slug: PLATFORM_ORGANIZATION_SLUG },
    { name: 'AI transition carrière', logoUrl: null, isPlatform: true }
  )
}

export async function createUser(
  role: UserRole,
  organization?: Organization,
  overrides: Partial<Pick<User, 'email' | 'name'>> = {}
): Promise<User> {
  const org = organization ?? (await createOrganization())
  return UserFactory.merge({ organizationId: org.id, role, ...overrides }).create()
}

/** Conseiller d'une organisation (nouvelle si non fournie). */
export function createAdvisor(organization?: Organization): Promise<User> {
  return createUser(USERS_ROLES.ADVISOR, organization)
}

/** Administrateur d'une organisation (nouvelle si non fournie). */
export function createAdmin(organization?: Organization): Promise<User> {
  return createUser(USERS_ROLES.ADMIN, organization)
}

/**
 * Super administrateur : membre de l'organisation plateforme par défaut. Lui
 * passer une organisation cliente crée un super admin « hors plateforme »
 * (cas limite, traité comme un compte client par le back-office).
 */
export async function createSuperAdmin(organization?: Organization): Promise<User> {
  return createUser(USERS_ROLES.SUPER_ADMIN, organization ?? (await createPlatformOrganization()))
}

/** Expert interne : conseiller (`advisor`) de l'organisation plateforme, assignable à un B2C. */
export async function createInHouseExpert(): Promise<User> {
  return createUser(USERS_ROLES.ADVISOR, await createPlatformOrganization())
}

export interface CandidateActor {
  user: User
  employee: Employee
}

/**
 * Candidat : un `User` de rôle `employee` **et** sa fiche `Employee` liée
 * (`user_id`), rattachée au conseiller s'il est fourni. `onboarded` vaut `true`
 * par défaut : `checkOnboarding()` redirige sinon toutes les routes candidat
 * vers l'onboarding.
 */
export async function createCandidate(
  options: { organization?: Organization; advisor?: User; onboarded?: boolean } = {}
): Promise<CandidateActor> {
  const org = options.organization ?? (await createOrganization())
  const user = await createUser(USERS_ROLES.EMPLOYEE, org)
  const employee = await EmployeeFactory.merge({
    organizationId: org.id,
    advisorId: options.advisor?.id ?? null,
    userId: user.id,
    email: user.email,
    name: user.name ?? 'Candidat',
    status: 'active',
    onboarded: options.onboarded ?? true,
  }).create()
  return { user, employee }
}

/**
 * Particulier B2C (#92) : compte `employee` + fiche `account_type = 'b2c'`
 * dans l'organisation plateforme, sans conseiller (`advisorId: null`) sauf si
 * un expert est fourni. `onboarded` vaut `true` par défaut, comme `createCandidate`.
 * `paid: true` ajoute un paiement Stripe `paid` qui ouvre l'accès aux résultats (#94).
 * `emailVerified: true` pose `emailVerifiedAt` (#98) ; l'adresse n'est pas vérifiée par défaut.
 */
export async function createB2cCandidate(
  options: { onboarded?: boolean; expert?: User; paid?: boolean; emailVerified?: boolean } = {}
): Promise<CandidateActor> {
  const platform = await createPlatformOrganization()
  const user = await createUser(USERS_ROLES.EMPLOYEE, platform)
  if (options.emailVerified) {
    user.emailVerifiedAt = DateTime.now()
    await user.save()
  }
  const employee = await EmployeeFactory.merge({
    organizationId: platform.id,
    advisorId: options.expert?.id ?? null,
    userId: user.id,
    email: user.email,
    name: user.name ?? 'Particulier',
    status: EMPLOYEES_STATUS.ACTIVE,
    onboarded: options.onboarded ?? true,
    accountType: ACCOUNT_TYPES.B2C,
  }).create()
  if (options.paid) {
    await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      userId: user.id,
      organizationId: platform.id,
    })
      .apply('paid')
      .create()
  }
  return { user, employee }
}

/** Fiche candidat sans compte utilisateur, suivie par `advisor`. */
export async function createEmployeeFor(advisor: User): Promise<Employee> {
  return EmployeeFactory.merge({
    organizationId: advisor.organizationId,
    advisorId: advisor.id,
    userId: null,
    status: 'active',
  }).create()
}
