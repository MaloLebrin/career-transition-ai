import EmployeeSynthesis, {
  EMPLOYEE_SYNTHESIS_SHARE_STATUSES,
} from '#models/employee_synthesis'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class EmployeeSynthesisSeeder extends BaseSeeder {
  async run() {
    const org = await Organization.findBy('slug', 'ftc-paris')
    if (!org) return

    const advisor = await User.query()
      .where('role', USERS_ROLES.ADVISOR)
      .where('organizationId', org.id)
      .first()
    if (!advisor) return

    const employees = await Employee.query().where('organizationId', org.id)
    for (const employee of employees) {
      const shouldShare = employee.onboarded

      await EmployeeSynthesis.updateOrCreate(
        { organizationId: org.id, employeeId: employee.id },
        {
          organizationId: org.id,
          employeeId: employee.id,
          shareStatus: shouldShare
            ? EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
            : EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
          sharedAt: shouldShare ? DateTime.now() : null,
          sharedByUserId: shouldShare ? advisor.id : null,
          expertCommentsShared: shouldShare
            ? `Message au talent: voici la synthèse de ton dossier.`
            : null,
          expertNotesInternal: `Prépa entretien (interne): hypothèses et points à creuser.`,
          executiveSummaryOverride: null,
        }
      )
    }
  }
}

