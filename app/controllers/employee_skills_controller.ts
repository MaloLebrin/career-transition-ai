import { EmployeeSkillService } from '#services/employee_skill_service'
import { EmployeesService } from '#services/employees_service'
import { updateEmployeeSkillValidator } from '#validators/employee_skill/update_employee_skill_validator.js'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EmployeeSkillsController {
  constructor(
    private employeeSkillService: EmployeeSkillService,
    private employeesService: EmployeesService
  ) { }

  public async update({ auth, request, response }: HttpContext) {
    const skill = await request.validateUsing(updateEmployeeSkillValidator)
    const user = auth.user!
    const employee = await this.employeesService.getEmployeeForUser(user)

    if (!skill) {
      return response.badRequest({ message: 'Invalid skills data' })
    }

    await this.employeeSkillService.updateEmployeeSkillLevel({
      employeeId: employee.id,
      skillId: skill.id,
      level: skill.level,
    })

    return response.redirect('/dashboard/candidat/profile')
  }
}
