import { ExperienceService } from '#services/experience_service'
import { experienceCreateValidator } from '#validators/experiences/experience_create_validator'
import { experienceUpdateValidator } from '#validators/experiences/experience_update_validator'
import { idEntityValidator } from '#validators/id_entity_validator'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ExperiencesController {
  constructor(private experienceService: ExperienceService) { }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(experienceCreateValidator)
    await this.experienceService.create({
      ...data,
      isCurrent: data.isCurrent || false,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async update({ request, response }: HttpContext) {
    const data = await request.validateUsing(experienceUpdateValidator)
    await this.experienceService.update(data.id, {
      ...data,
      isCurrent: data.isCurrent || false,
    })
    return response.redirect('/dashboard/candidat/profile')
  }

  async delete({ request, response }: HttpContext) {
    const { id } = await request.validateUsing(idEntityValidator)
    await this.experienceService.delete(id)
    return response.redirect('/dashboard/candidat/profile')
  }
}
