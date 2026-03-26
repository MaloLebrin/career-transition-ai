import { EmployeeSkillService } from '#domains/skills/services/employee_skill_service'
import { EmployeesService } from '#domains/employees/services/employees_service'
import Skill from '#models/skill'
import { addEmployeeSkillValidator } from '#validators/employee_skill/add_employee_skill_validator'
import { updateEmployeeSkillValidator } from '#validators/employee_skill/update_employee_skill_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EmployeeSkillsController {
  constructor(
    private employeeSkillService: EmployeeSkillService,
    private employeesService: EmployeesService
  ) {}

  public async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(addEmployeeSkillValidator)
    const user = auth.user!
    const employee = await this.employeesService.getEmployeeForUser(user)

    const skill = await Skill.firstOrCreate(
      {
        organizationId: employee.organizationId,
        name: payload.name.trim(),
      },
      {
        organizationId: employee.organizationId,
        name: payload.name.trim(),
        category: payload.category?.trim() ?? null,
      }
    )

    await this.employeeSkillService.updateEmployeeSkillLevel({
      employeeId: employee.id,
      skillId: skill.id,
      level: payload.level,
    })

    return response.redirect('/dashboard/candidat/profile')
  }

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

