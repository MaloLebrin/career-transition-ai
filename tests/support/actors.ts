import type Employee from '#models/employee'
import type Organization from '#models/organization'
import type User from '#models/user'
import { EmployeeFactory } from '#database/factories/employee_factory'
import { OrganizationFactory } from '#database/factories/organization_factory'
import { UserFactory } from '#database/factories/user_factory'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'

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

/** Super administrateur de la plateforme. */
export function createSuperAdmin(organization?: Organization): Promise<User> {
  return createUser(USERS_ROLES.SUPER_ADMIN, organization)
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

/** Fiche candidat sans compte utilisateur, suivie par `advisor`. */
export async function createEmployeeFor(advisor: User): Promise<Employee> {
  return EmployeeFactory.merge({
    organizationId: advisor.organizationId,
    advisorId: advisor.id,
    userId: null,
    status: 'active',
  }).create()
}
