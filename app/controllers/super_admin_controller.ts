import Organization from '#models/organization'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

function assertSuperAdminOrFail(ctx: HttpContext) {
  const { auth, response } = ctx
  if (!auth.user) {
    return response.unauthorized()
  }
  if (auth.user.role !== 'super_admin') {
    return response.forbidden()
  }
}

export default class SuperAdminController {
  /**
   * Inertia page: super admin home with global metrics.
   */
  public async home({ inertia, response, auth }: HttpContext) {
    const guardResult = assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)
    if (guardResult) return guardResult

    const organizationsCount = await Organization.query().count('* as total')
    const usersCount = await User.query().count('* as total')

    const totalOrgs = Number(organizationsCount[0].$extras.total || 0)
    const totalUsers = Number(usersCount[0].$extras.total || 0)

    return (inertia as any).render('dashboard/SuperAdminHome', {
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
    const guardResult = assertSuperAdminOrFail({ inertia, response, auth } as HttpContext)
    if (guardResult) return guardResult

    const organizations = await Organization.query()
      .preload('users')
      .preload('employees')

    const items = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      usersCount: org.users.length,
      employeesCount: org.employees.length,
      createdAt: org.createdAt?.toISO() ?? null,
    }))

    return (inertia as any).render('dashboard/OrganizationsAdmin', {
      organizations: items,
    })
  }

  /**
   * Inertia form: create a new organization from the Super Admin dashboard.
   */
  public async storeOrganization({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    if (auth.user.role !== 'super_admin') {
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
    if (auth.user.role !== 'super_admin') {
      return response.forbidden()
    }

    const id = Number(params.id)
    const organization = await Organization.find(id)
    if (!organization) {
      session.flash('error', "Organisation introuvable.")
      return response.redirect('/dashboard/super-admin/organizations')
    }

    await organization.delete()
    session.flash('success', 'Organisation supprimée.')
    return response.redirect('/dashboard/super-admin/organizations')
  }
}

