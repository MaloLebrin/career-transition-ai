import Organization from '#models/organization'
import User from '#models/user'
import { PLATFORM_ORGANIZATION_SLUG } from '#shared/constants/organisation'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import env from '#start/env'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

/** Slug stable de l’organisation plateforme (recherche idempotente) — source : `#shared/constants/organisation`. */
export const PLATFORM_ORG_SLUG = PLATFORM_ORGANIZATION_SLUG
/** Email par défaut du super admin créé par ce seeder (surchargeable via `ADMIN_EMAIL`). */
export const PLATFORM_ADMIN_EMAIL = 'malolebrin@gmail.com'

export default class AdminSeeder extends BaseSeeder {
  async run() {
    const password = env.get('ADMIN_PASSWORD')?.trim()
    if (!password) {
      throw new Error(
        'ADMIN_PASSWORD est requis pour exécuter AdminSeeder (définir la variable d’environnement).'
      )
    }

    const adminEmail = env.get('ADMIN_EMAIL')?.trim().toLowerCase() || PLATFORM_ADMIN_EMAIL

    const adminOrganizationData = {
      name: 'AI transition carrière',
      slug: PLATFORM_ORG_SLUG,
      logoUrl: null as string | null,
      isPlatform: true,
    }

    const organization = await Organization.updateOrCreate(
      { slug: PLATFORM_ORG_SLUG },
      adminOrganizationData
    )

    await User.updateOrCreate(
      { organizationId: organization.id, email: adminEmail },
      {
        organizationId: organization.id,
        email: adminEmail,
        password,
        name: 'Malo Lebrin',
        role: USERS_ROLES.SUPER_ADMIN,
      }
    )
  }
}
