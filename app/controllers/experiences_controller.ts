import { EmployeesService } from '#services/employees_service'
import { ExperienceService } from '#services/experience_service'
import { experienceCreateValidator } from '#validators/experiences/experience_create_validator'
import { experienceUpdateValidator } from '#validators/experiences/experience_update_validator'
import { idEntityValidator } from '#validators/id_entity_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ExperiencesController {
  constructor(
    private experienceService: ExperienceService,
    private employeesService: EmployeesService
  ) {}

  async store({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(experienceCreateValidator)
    const user = auth.user!
    const employee = await this.employeesService.getEmployeeForUser(user)
    await this.experienceService.create({
      ...data,
      isCurrent: data.isCurrent || false,
      employeeId: employee.id,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async update({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(experienceUpdateValidator)
    const employee = await this.employeesService.getEmployeeForUser(auth.user!)
    const { id, ...fields } = data
    await this.experienceService.update(employee.id, id, {
      ...fields,
      isCurrent: fields.isCurrent || false,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async delete({ request, response, auth }: HttpContext) {
    const { id } = await request.validateUsing(idEntityValidator)
    const employee = await this.employeesService.getEmployeeForUser(auth.user!)
    await this.experienceService.delete(employee.id, id)
    return response.redirect('/dashboard/candidat/profile')
  }
}
