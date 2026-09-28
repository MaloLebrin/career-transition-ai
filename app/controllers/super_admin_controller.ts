import LogExerciseUsageExport from '#jobs/log_exercise_usage_export'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import User from '#models/user'
import { SuperAdminOrganizationsService } from '#services/super_admin_organizations_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createOrganizationValidator } from '#validators/organization/organization_create_validator'
import { createPlatformUserValidator } from '#validators/super_admin/create_platform_user_validator'
import { updateUserRoleValidator } from '#validators/super_admin/update_user_role_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

@inject()
export default class SuperAdminController {
  constructor(
    private superAdminOrganizationsService: SuperAdminOrganizationsService,
    private superAdminUsersService: SuperAdminUsersService
  ) {}
  /**
   * Inertia page: super admin home with global metrics.
   */
  public async home({ inertia }: HttpContext) {
    const organizationsCount = await Organization.query().count('* as total')
    const usersCount = await User.query().count('* as total')

    const totalOrgs = Number(organizationsCount[0].$extras.total || 0)
    const totalUsers = Number(usersCount[0].$extras.total || 0)
    const stats = {
      organizations: totalOrgs,
      users: totalUsers,
    }

    logger.info('Super admin home', { stats: JSON.stringify(stats) })

    return inertia.render('dashboard/admin/home/Home', { stats })
  }

  /**
   * Inertia page: list client organizations with basic aggregates.
   * Excludes the current super admin's own organization (e.g. platform / internal cabinet).
   */
  public async organizations({ inertia, auth }: HttpContext) {
    const currentUser = auth.user!
    const platformOrganizationId = Number(currentUser.organizationId)
    const excludeOrgId = Number.isFinite(platformOrganizationId) ? platformOrganizationId : -1
    const organizations = await Organization.query()
      .where('id', '!=', excludeOrgId)
      .preload('users', (query) => query.orderBy('id', 'asc'))
      .preload('employees')

    logger.info('Super admin organizations', { organizations: JSON.stringify(organizations) })

    const items = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      // Propriétaire = premier admin de l'organisation (à défaut, premier compte créé — cas
      // de l'inscription en libre-service, dont le créateur est conseiller) : cible des
      // actions impersonation / reset mot de passe.
      ownerId:
        (org.users.find((user) => user.role === USERS_ROLES.ADMIN) ?? org.users[0])?.id ?? null,
      usersCount: org.users.length,
      employeesCount: org.employees.length,
      createdAt: org.createdAt?.toISO() ?? null,
    }))

    return inertia.render('dashboard/admin/organizations/Index', {
      organizations: items,
    })
  }

  /**
   * Inertia page: aggregated exercise usage per organization for a given period.
   */
  public async exerciseUsage({ inertia, request }: HttpContext) {
    const qs = request.qs()
    const from =
      typeof qs.from === 'string' && qs.from.length > 0
        ? qs.from
        : DateTime.now().minus({ days: 30 }).toISODate()
    const to = typeof qs.to === 'string' && qs.to.length > 0 ? qs.to : DateTime.now().toISODate()
    const organizationId =
      typeof qs.organizationId === 'string' && qs.organizationId.length > 0
        ? Number(qs.organizationId)
        : null

    const query = ExerciseResult.query()
      .join('employees', 'employees.id', 'exercise_results.employee_id')
      .join('organizations', 'organizations.id', 'employees.organization_id')
      .where('exercise_results.status', 'completed')
      .andWhere((builder) => {
        builder
          .where('exercise_results.date', '>=', from)
          .andWhere('exercise_results.date', '<=', to)
      })
      .select(
        'organizations.id as organizationId',
        'organizations.name as organizationName',
        'exercise_results.type as type'
      )
      .count('* as total')
      .groupBy('organizations.id', 'organizations.name', 'exercise_results.type')

    if (organizationId) {
      query.andWhere('organizations.id', organizationId)
    }

    const rows = await query

    const organizationsMap: Record<
      number,
      {
        id: number
        name: string
        totalsByType: Record<string, number>
        totalExercises: number
      }
    > = {}

    for (const row of rows) {
      const orgId = Number((row as any).$extras.organizationId ?? (row as any).organizationId)
      const orgName =
        (row as any).$extras.organizationName ?? (row as any).organizationName ?? 'Inconnu'
      const type = String((row as any).type ?? (row as any).$extras.type)
      const total = Number((row as any).$extras.total ?? 0)

      if (!organizationsMap[orgId]) {
        organizationsMap[orgId] = {
          id: orgId,
          name: orgName,
          totalsByType: {},
          totalExercises: 0,
        }
      }

      const org = organizationsMap[orgId]
      org.totalsByType[type] = (org.totalsByType[type] || 0) + total
      org.totalExercises += total
    }

    const organizations = Object.values(organizationsMap).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    const allOrgs = await Organization.query().select('id', 'name').orderBy('name', 'asc')

    return inertia.render('dashboard/admin/exercises/Usage', {
      filters: {
        from,
        to,
        organizationId,
      },
      organizations,
      organizationsOptions: allOrgs.map((org) => ({
        id: org.id,
        name: org.name,
      })),
    })
  }

  /**
   * CSV export: exercise usage per organization and type for a given period.
   */
  public async exerciseUsageExport({ auth, request, response }: HttpContext) {
    const qs = request.qs()
    const from =
      typeof qs.from === 'string' && qs.from.length > 0
        ? qs.from
        : DateTime.now().minus({ days: 30 }).toISODate()
    const to = typeof qs.to === 'string' && qs.to.length > 0 ? qs.to : DateTime.now().toISODate()
    const organizationId =
      typeof qs.organizationId === 'string' && qs.organizationId.length > 0
        ? Number(qs.organizationId)
        : null

    const query = ExerciseResult.query()
      .join('employees', 'employees.id', 'exercise_results.employee_id')
      .join('organizations', 'organizations.id', 'employees.organization_id')
      .where('exercise_results.status', 'completed')
      .andWhere((builder) => {
        builder
          .where('exercise_results.date', '>=', from)
          .andWhere('exercise_results.date', '<=', to)
      })
      .select(
        'organizations.id as organizationId',
        'organizations.name as organizationName',
        'exercise_results.type as type'
      )
      .count('* as total')
      .groupBy('organizations.id', 'organizations.name', 'exercise_results.type')

    if (organizationId) {
      query.andWhere('organizations.id', organizationId)
    }

    const rows = await query

    await LogExerciseUsageExport.dispatch({
      userId: auth.user!.id,
      from,
      to,
      organizationId,
    }).toQueue('analytics')

    const header = ['organization_id', 'organization_name', 'type', 'count']
    const lines = [header.join(',')]

    for (const row of rows) {
      const orgId = Number((row as any).$extras.organizationId ?? (row as any).organizationId)
      const orgName =
        (row as any).$extras.organizationName ?? (row as any).organizationName ?? 'Inconnu'
      const type = String((row as any).type ?? (row as any).$extras.type)
      const total = Number((row as any).$extras.total ?? 0)

      const escapedName = `"${String(orgName).replace(/"/g, '""')}"`
      lines.push([orgId, escapedName, type, total].join(','))
    }

    const csv = lines.join('\n')
    response.header('content-type', 'text/csv; charset=utf-8')
    response.header(
      'content-disposition',
      `attachment; filename="exercises-usage-${from}-to-${to}.csv"`
    )
    return response.send(csv)
  }

  /**
   * Inertia page: list users with global filters and role overview.
   * Excludes users in the current super admin's own organization (e.g. platform / internal cabinet).
   */
  public async users({ inertia, auth }: HttpContext) {
    const currentUser = auth.user!
    const platformOrganizationId = Number(currentUser.organizationId)
    const excludeOrgId = Number.isFinite(platformOrganizationId) ? platformOrganizationId : -1

    const [users, organizationRows] = await Promise.all([
      User.query().where('organizationId', '!=', excludeOrgId).preload('organization'),
      Organization.query()
        .where('id', '!=', excludeOrgId)
        .orderBy('name', 'asc')
        .select('id', 'name', 'slug'),
    ])

    const items = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
        ? { id: user.organization.id, name: user.organization.name }
        : null,
      createdAt: user.createdAt?.toISO() ?? null,
      onboardingCompleted: user.onboardingCompletedAt !== null,
    }))

    const organizations = organizationRows.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
    }))

    return inertia.render('dashboard/admin/users/Index', {
      users: items,
      organizations,
    })
  }

  /**
   * Inertia form: create a user in a client organization and send onboarding email.
   */
  public async storeUser({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(createPlatformUserValidator)
    const currentUser = auth.user!

    await this.superAdminUsersService.createUserWithInvite({
      organizationId: payload.organizationId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      platformOrganizationId: currentUser.organizationId,
    })

    session.flash('success', 'Utilisateur créé. Un email d’invitation a été envoyé.')
    return response.redirect('/dashboard/super-admin/users')
  }

  /**
   * Inertia form: resend set-password link for users who have not completed onboarding.
   */
  public async resendUserOnboarding({ params, response, session, auth }: HttpContext) {
    const id = Number(params.id)
    const currentUser = auth.user!
    const user = await User.find(id)

    if (!user || user.organizationId === currentUser.organizationId) {
      session.flash('error', 'Utilisateur introuvable.')
      return response.redirect('/dashboard/super-admin/users')
    }

    await this.superAdminUsersService.resendOnboardingInvitation(user)
    session.flash('success', `Lien d’invitation renvoyé à ${user.email}.`)
    return response.redirect('/dashboard/super-admin/users')
  }

  /**
   * Inertia form: update a user's role from the Super Admin dashboard.
   */
  public async updateUserRole({ request, params, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(updateUserRoleValidator)
    const user = await this.superAdminUsersService.updateRole(
      auth.getUserOrFail(),
      Number(params.id),
      payload.role
    )

    session.flash('success', `Rôle mis à jour pour ${user.name}.`)
    return response.redirect('/dashboard/super-admin/users')
  }

  /**
   * Inertia form: create a new organization from the Super Admin dashboard.
   */
  public async storeOrganization({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(createOrganizationValidator)

    await this.superAdminOrganizationsService.createOrganizationWithOwner({
      organizationName: payload.name,
      organizationSlug: payload.slug,
      ownerName: payload.ownerName,
      ownerEmail: payload.ownerEmail,
    })
    session.flash(
      'success',
      'Organisation créée. Email envoyé au propriétaire pour créer son mot de passe.'
    )
    return response.redirect('/dashboard/super-admin/organizations')
  }

  /**
   * Inertia form: delete an organization from the Super Admin dashboard.
   */
  public async destroyOrganization({ params, response, session, auth }: HttpContext) {
    const id = Number(params.id)
    const organization = await Organization.find(id)
    if (!organization) {
      session.flash('error', 'Organisation introuvable.')
      return response.redirect('/dashboard/super-admin/organizations')
    }

    if (organization.id === auth.user!.organizationId) {
      session.flash('error', 'Vous ne pouvez pas supprimer votre propre organisation.')
      return response.redirect('/dashboard/super-admin/organizations')
    }

    // Les clés étrangères users/employees → organizations sont en RESTRICT.
    await organization.loadCount('users').loadCount('employees')
    if (
      Number(organization.$extras.users_count) > 0 ||
      Number(organization.$extras.employees_count) > 0
    ) {
      session.flash(
        'error',
        'Impossible de supprimer une organisation qui compte encore des utilisateurs ou des talents.'
      )
      return response.redirect('/dashboard/super-admin/organizations')
    }

    await organization.delete()
    session.flash('success', 'Organisation supprimée.')
    return response.redirect('/dashboard/super-admin/organizations')
  }
}
