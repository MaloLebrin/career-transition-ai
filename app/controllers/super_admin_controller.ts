import Organization from '#models/organization'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SuperAdminController {
  /**
   * Inertia page: super admin home with global metrics.
   */
  public async home({ inertia, response, auth }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

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
    if (!auth.user) {
      return response.unauthorized()
    }

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
}

