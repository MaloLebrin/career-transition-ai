import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { BaseSchema } from '@adonisjs/lucid/schema'
import { PLATFORM_ADMIN_EMAIL, PLATFORM_ORG_SLUG } from '../seeders/admin_seeder'

export default class extends BaseSchema {
  async up() {
    // Seed users only in production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const password = process.env.ADMIN_PASSWORD?.trim()
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

    const organization2 = await Organization.updateOrCreate(
      { slug: 'pleiade-consulting' },
      { name: 'Pleiade Consulting', slug: 'pleiade-consulting', logoUrl: null }
    )

    const emailAddressUser2 = 'clara.lengline4@gmail.com'

    await User.updateOrCreate(
      { organizationId: organization2.id, email: emailAddressUser2 },
      {
        organizationId: organization2.id,
        email: emailAddressUser2,
        password,
        name: 'Clara Lengline',
        role: USERS_ROLES.ADMIN,
      }
    )
  }
}
