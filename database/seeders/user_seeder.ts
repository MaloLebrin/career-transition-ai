import Organization from '#models/organization'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const ftcParis = await Organization.findByOrFail('slug', 'ftc-paris')

    const users = [
      {
        organizationId: ftcParis.id,
        email: 'admin@ftc.fr',
        password: 'password',
        name: 'Clara Lengliné',
        role: 'admin' as const,
      },
      {
        organizationId: ftcParis.id,
        email: 'advisor@ftc.fr',
        password: 'password',
        name: 'Sophie Renard',
        role: 'advisor' as const,
      },
      {
        organizationId: ftcParis.id,
        email: 'h.duboc@example.fr',
        password: 'password',
        name: 'Hubert Duboc',
        role: 'employee' as const,
      },
      {
        organizationId: ftcParis.id,
        email: 'm.lebrin@example.fr',
        password: 'password',
        name: 'Malo Lebrin',
        role: 'employee' as const,
      },
    ]

    for (const row of users) {
      await User.updateOrCreate(
        { organizationId: row.organizationId as number | undefined, email: row.email },
        row
      )
    }
  }
}
