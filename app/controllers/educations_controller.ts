import { EducationService } from '#services/education_service'
import { createEducationValidator } from '#validators/education/create_education_validator'
import { updateEducationValidator } from '#validators/education/update_education_validator'
import { idEntityValidator } from '#validators/id_entity_validator'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EducationsController {
  constructor(private educationService: EducationService) { }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createEducationValidator)
    await this.educationService.create({
      ...data,
      description: data.description || null,
      isCurrent: data.isCurrent || false,
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
