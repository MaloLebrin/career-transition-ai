import Organization from '#models/organization'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class OrganizationSeeder extends BaseSeeder {
  async run() {
    const rows = [
      { name: 'FTC Paris', slug: 'ftc-paris', logoUrl: null },
      { name: 'FTC Lyon', slug: 'ftc-lyon', logoUrl: null },
    ]
    for (const row of rows) {
      await Organization.updateOrCreate({ slug: row.slug }, row)
    }
  }
}
