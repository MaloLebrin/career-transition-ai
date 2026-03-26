import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES, userRolesValues } from '#shared/constants/user'
import ExerciseResult from '#models/exercise_result'
import LogExerciseUsageExport from '#jobs/log_exercise_usage_export'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

function assertSuperAdminOrFail(ctx: HttpContext): boolean {
  const { auth, response } = ctx
  if (!auth.user) {
    response.unauthorized()
    return false
  }
  if (auth.user.role !== 'super_admin') {
    response.forbidden()
    return false
  }
  return true
}

export default class SuperAdminController {
  /**
   * Inertia page: super admin home with global metrics.
   */
  public async home({ inertia, response, auth }: HttpContext) {
    if (!assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)) {
      return
    }

    const organizationsCount = await Organization.query().count('* as total')
    const usersCount = await User.query().count('* as total')

    const totalOrgs = Number(organizationsCount[0].$extras.total || 0)
    const totalUsers = Number(usersCount[0].$extras.total || 0)

    return (inertia as any).render('dashboard/admin/home/Home', {
      stats: {
        organizations: totalOrgs,
        users: totalUsers,
      },
    })
  }

  /**
   * Inertia page: list all organizations with basic aggregates.
   */
  public async organizations({ inertia, response, auth }: HttpContext) {
    if (!assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)) {
      return
    }

    const organizations = await Organization.query().preload('users').preload('employees')

    const items = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      usersCount: org.users.length,
      employeesCount: org.employees.length,
      createdAt: org.createdAt?.toISO() ?? null,
    }))

    return (inertia as any).render('dashboard/admin/organizations/Index', {
      organizations: items,
    })
  }

  /**
   * Inertia page: aggregated exercise usage per organization for a given period.
   */
  public async exerciseUsage({ inertia, response, auth, request }: HttpContext) {
    if (!assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)) {
      return
    }

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

    return (inertia as any).render('dashboard/admin/exercises/Usage', {
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
    if (!auth.user) {
      return response.unauthorized()
    }
    if (auth.user.role !== 'super_admin') {
      return response.forbidden()
    }

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
      userId: auth.user.id,
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
   * Inertia page: list all users with global filters and role overview.
   */
  public async users({ inertia, response, auth }: HttpContext) {
    if (!assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)) {
      return
    }

    const users = await User.query().preload('organization')

    const items = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
        ? { id: user.organization.id, name: user.organization.name }
        : null,
      createdAt: user.createdAt?.toISO() ?? null,
    }))

    return (inertia as any).render('dashboard/admin/users/Index', {
      users: items,
    })
  }

  /**
   * Inertia form: update a user's role from the Super Admin dashboard.
   */
  public async updateUserRole({ auth, request, params, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    if (auth.user.role !== USERS_ROLES.SUPER_ADMIN) {
      return response.forbidden()
    }

    const updateRoleValidator = vine.compile(
      vine.object({
        role: vine.enum(userRolesValues),
      })
    )

    const payload = await request.validateUsing(updateRoleValidator)
    const id = Number(params.id)
    const user = await User.find(id)
    if (!user) {
      session.flash('error', 'Utilisateur introuvable.')
      return response.redirect('/dashboard/super-admin/users')
    }

    user.role = payload.role
    await user.save()

    session.flash('success', `Rôle mis à jour pour ${user.name}.`)
    return response.redirect('/dashboard/super-admin/users')
  }

  /**
   * Inertia form: create a new organization from the Super Admin dashboard.
   */
  public async storeOrganization({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    if (auth.user.role !== USERS_ROLES.SUPER_ADMIN) {
      return response.forbidden()
    }

    const createOrganizationValidator = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(255),
        slug: vine.string().trim().maxLength(100).optional(),
      })
    )

    const payload = await request.validateUsing(createOrganizationValidator)

    const baseSlug =
      payload.slug ||
      payload.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    await Organization.create({
      name: payload.name,
      slug: baseSlug,
    })

    session.flash('success', 'Organisation créée.')
    return response.redirect('/dashboard/super-admin/organizations')
  }

  /**
   * Inertia form: delete an organization from the Super Admin dashboard.
   */
  public async destroyOrganization({ auth, params, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    if (auth.user.role !== USERS_ROLES.SUPER_ADMIN) {
      return response.forbidden()
    }

    const id = Number(params.id)
    const organization = await Organization.find(id)
    if (!organization) {
      session.flash('error', 'Organisation introuvable.')
      return response.redirect('/dashboard/super-admin/organizations')
    }

    await organization.delete()
    session.flash('success', 'Organisation supprimée.')
    return response.redirect('/dashboard/super-admin/organizations')
  }
}
