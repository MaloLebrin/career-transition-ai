import { EducationService } from '#services/education_service'
import { EmployeesService } from '#services/employees_service'
import { createEducationValidator } from '#validators/education/create_education_validator'
import { updateEducationValidator } from '#validators/education/update_education_validator'
import { idEntityValidator } from '#validators/id_entity_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EducationsController {
  constructor(
    private educationService: EducationService,
    private employeesService: EmployeesService
  ) { }

  async store({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(createEducationValidator)
    const user = auth.user!
    const employee = await this.employeesService.getEmployeeForUser(user)
    await this.educationService.create({
      ...data,
      description: data.description || null,
      isCurrent: data.isCurrent || false,
      employeeId: employee.id,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async update({ request, response }: HttpContext) {
    const data = await request.validateUsing(updateEducationValidator)
    await this.educationService.update(data.id, {
      ...data,
      description: data.description || null,
      isCurrent: data.isCurrent || false,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async delete({ request, response }: HttpContext) {
    const { id } = await request.validateUsing(idEntityValidator)
    await this.educationService.delete(id)
    return response.redirect('/dashboard/candidat/profile')
  }
}
