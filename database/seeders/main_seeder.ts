import EmployeeSeeder from '#database/seeders/employee_seeder'
import EmployeeSynthesisSeeder from '#database/seeders/employee_synthesis_seeder'
import MaloExercisesSeeder from '#database/seeders/malo_exercise_seeder'
import MediaSeeder from '#database/seeders/media_seeder'
import OrganizationSeeder from '#database/seeders/organization_seeder'
import SkillSeeder from '#database/seeders/skill_seeder'
import UserSeeder from '#database/seeders/user_seeder'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import AdminSeeder from './admin_seeder.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    await new AdminSeeder(this.client).run()
    await new OrganizationSeeder(this.client).run()
    await new UserSeeder(this.client).run()
    await new SkillSeeder(this.client).run()
    await new EmployeeSeeder(this.client).run()
    await new MaloExercisesSeeder(this.client).run()
    await new EmployeeSynthesisSeeder(this.client).run()
    await new MediaSeeder(this.client).run()
  }
}
