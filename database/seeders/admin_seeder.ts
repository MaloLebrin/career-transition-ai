import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import env from '#start/env'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/** Slug stable de l’organisation plateforme (recherche idempotente). */
export const PLATFORM_ORG_SLUG = 'ai-transition-carriere'
/** Email du compte super admin créé par ce seeder. */
export const PLATFORM_ADMIN_EMAIL = 'malolebrin@gmail.com'

export default class AdminSeeder extends BaseSeeder {
  async run() {
    const password = env.get('ADMIN_PASSWORD')?.trim()
    if (!password) {
      throw new Error(
        'ADMIN_PASSWORD est requis pour exécuter AdminSeeder (définir la variable d’environnement).'
      )
    }

    const adminOrganizationData = {
      name: 'AI transition carrière',
      slug: PLATFORM_ORG_SLUG,
      logoUrl: null as string | null,
    }

    const organization = await Organization.updateOrCreate(
      { slug: PLATFORM_ORG_SLUG },
      adminOrganizationData
    )

    await User.updateOrCreate(
      { organizationId: organization.id, email: PLATFORM_ADMIN_EMAIL },
      {
        organizationId: organization.id,
        email: PLATFORM_ADMIN_EMAIL,
        password,
        name: 'Malo Lebrin',
        role: USERS_ROLES.SUPER_ADMIN,
      }
    )
  }
}
