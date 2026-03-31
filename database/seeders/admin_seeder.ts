import Organization from '#models/organization'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class AdminSeeder extends BaseSeeder {
  async run() {
    const adminOrganizationData = {
      name: 'AI transition carrière',
      slug: 'ai-transition-carriere',
      logoUrl: null,
    }
    const organization = await Organization.updateOrCreate(
      adminOrganizationData,
      adminOrganizationData
    )

    const adminUserData = {
      organizationId: organization.id,
      email: 'malo@ai-transition-carriere.fr',
      password: process.env.ADMIN_PASSWORD,
      name: 'Malo Lebrin',
      role: 'super_admin' as const,
    }

    await User.updateOrCreate(adminUserData, adminUserData)
  }
}
