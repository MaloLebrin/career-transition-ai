import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import User from '#models/user'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { Paginated } from '#shared/types/pagination'
import type { OrganizationListItem, OrganizationListParams } from '#shared/types/super_admin/lists'
import { containsPattern, paginationMeta } from '#utils/pagination'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import crypto from 'node:crypto'

/** Plus grand identifiant PostgreSQL `integer` : au-delà, une recherche par id ferait échouer la requête. */
const MAX_INT = 2147483647

type CreateOrganizationWithOwnerInput = {
  organizationName: string
  organizationSlug?: string
  ownerName: string
  ownerEmail: string
}

@inject()
export class SuperAdminOrganizationsService {
  constructor(private onboardingMailService: OnboardingMailService) {}

  /**
   * Une page des organisations clientes (hors organisation plateforme). Recherche par nom,
   * slug ou identifiant ; `minEmployees` filtre sur le nombre de candidats. Les compteurs sont
   * calculés en base (`withCount`) : aucune organisation n'est chargée avec tous ses membres.
   */
  public async list(
    platformOrganizationId: number,
    params: OrganizationListParams
  ): Promise<Paginated<OrganizationListItem>> {
    const query = Organization.query()
      .where('id', '!=', platformOrganizationId)
      .withCount('users', (q) => q.as('usersCount'))
      .withCount('employees', (q) => q.as('employeesCount'))
      .orderBy([
        { column: 'name', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])
      .if(params.minEmployees !== null, (q) =>
        q.whereRaw(
          '(SELECT COUNT(*) FROM employees WHERE employees.organization_id = organizations.id) >= ?',
          [params.minEmployees!]
        )
      )
    if (params.search) {
      const pattern = containsPattern(params.search)
      const numericId = /^\d+$/.test(params.search) ? Number(params.search) : null
      query.where((builder) => {
        builder.whereILike('name', pattern).orWhereILike('slug', pattern)
        if (numericId !== null && numericId <= MAX_INT) builder.orWhere('id', numericId)
      })
    }

    const paginator = await query.paginate(params.page, LIST_PAGE_SIZE)
    const organizations = paginator.all()
    const owners = await this.ownersOf(organizations.map((org) => org.id))

    return {
      items: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerId: owners.get(org.id) ?? null,
        usersCount: Number(org.$extras.usersCount),
        employeesCount: Number(org.$extras.employeesCount),
        createdAt: org.createdAt?.toISO() ?? null,
      })),
      pagination: paginationMeta(paginator, LIST_PAGE_SIZE),
    }
  }

  /** Propriétaire de chaque organisation : premier admin, à défaut premier compte créé. */
  private async ownersOf(organizationIds: number[]): Promise<Map<number, number>> {
    const owners = new Map<number, number>()
    if (organizationIds.length === 0) return owners
    const users = await User.query()
      .whereIn('organizationId', organizationIds)
      .select('id', 'organizationId', 'role')
      .orderBy('id', 'asc')
    const firstAdmin = new Map<number, number>()
    for (const user of users) {
      if (!owners.has(user.organizationId)) owners.set(user.organizationId, user.id)
      if (user.role === USERS_ROLES.ADMIN && !firstAdmin.has(user.organizationId)) {
        firstAdmin.set(user.organizationId, user.id)
      }
    }
    for (const [organizationId, adminId] of firstAdmin) owners.set(organizationId, adminId)
    return owners
  }

  public async createOrganizationWithOwner(input: CreateOrganizationWithOwnerInput): Promise<{
    organization: Organization
    owner: User
    token: OnboardingToken
  }> {
    const organizationName = input.organizationName.trim()
    const ownerName = input.ownerName.trim()
    const ownerEmail = input.ownerEmail.trim()

    const existingUser = await User.query()
      .whereRaw('LOWER(email) = ?', [ownerEmail.toLowerCase()])
      .first()
    if (existingUser) {
      throw new EmailAlreadyUsedException()
    }

    const existingOrg = await Organization.findBy('name', organizationName)
    if (existingOrg) {
      throw new OrganizationNameAlreadyUsedException()
    }

    const trx = await db.transaction()
    let organization!: Organization
    let owner!: User
    let token!: OnboardingToken

    try {
      organization = await Organization.create(
        {
          name: organizationName,
          slug: input.organizationSlug?.trim() || undefined,
        },
        { client: trx }
      )

      const temporaryPassword = crypto.randomBytes(32).toString('hex')
      owner = await User.create(
        {
          organizationId: organization.id,
          email: ownerEmail,
          name: ownerName,
          password: temporaryPassword,
          role: USERS_ROLES.ADMIN,
        },
        { client: trx }
      )

      token = await OnboardingToken.createForUser(owner.id, { client: trx })

      await trx.commit()
    } catch (err) {
      await trx.rollback()
      throw err
    }

    await this.onboardingMailService.sendSetPasswordLink({
      user: owner,
      token,
    })

    return { organization, owner, token }
  }
}
