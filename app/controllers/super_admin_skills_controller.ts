import { SuperAdminSkillsService } from '#services/super_admin_skills_service'
import { parseListParams } from '#shared/helpers/pagination'
import { skillValidator } from '#validators/super_admin/skill_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Catalogue de compétences global, côté super admin (#73). */
@inject()
export default class SuperAdminSkillsController {
  constructor(private skills: SuperAdminSkillsService) {}

  /** GET /dashboard/super-admin/skills */
  public async index({ inertia, request }: HttpContext) {
    const params = parseListParams(request.qs())
    const { items, pagination } = await this.skills.list(params)

    return inertia.render('dashboard/admin/skills/Index', {
      skills: items,
      pagination,
      filters: { search: params.search },
    })
  }

  /** POST /dashboard/super-admin/skills */
  public async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(skillValidator)
    await this.skills.create({ name: payload.name, category: payload.category ?? null })
    session.flash('success', 'Compétence ajoutée au catalogue.')
    return response.redirect().back()
  }

  /** PUT /dashboard/super-admin/skills/:id */
  public async update({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(skillValidator)
    await this.skills.update(Number(params.id), {
      name: payload.name,
      category: payload.category ?? null,
    })
    session.flash('success', 'Compétence mise à jour.')
    return response.redirect().back()
  }

  /** DELETE /dashboard/super-admin/skills/:id */
  public async destroy({ params, response, session }: HttpContext) {
    await this.skills.destroy(Number(params.id))
    session.flash('success', 'Compétence supprimée du catalogue.')
    return response.redirect().back()
  }
}
