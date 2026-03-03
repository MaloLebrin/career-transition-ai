import { OrganizationsService } from '#services/organizations_service'
import { inviteAdvisorValidator } from '#validators/invite_advisor_validator'
import { updateOrganizationValidator } from '#validators/organization_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Organization from '#models/organization'

@inject()
export default class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  public async show({ params, auth, response }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = Number(params.id)
    if (auth.user.organizationId !== orgId) {
      return response.forbidden()
    }
    const dto = await this.organizationsService.getById(orgId)
    if (!dto) {
      return response.notFound()
    }
    return response.json(dto)
  }

  public async update({ params, request, auth, response }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = Number(params.id)
    if (auth.user.organizationId !== orgId) {
      return response.forbidden()
    }
    const org = await Organization.findOrFail(orgId)
    const payload = await request.validateUsing(updateOrganizationValidator)
    const dto = await this.organizationsService.update(org, payload)
    return response.json(dto)
  }

  public async indexAdvisors({ params, auth, response }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = Number(params.id)
    if (auth.user.organizationId !== orgId) {
      return response.forbidden()
    }
    const list = await this.organizationsService.listAdvisors(orgId)
    return response.json(list)
  }

  public async storeAdvisor({ params, request, auth, response }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = Number(params.id)
    if (auth.user.organizationId !== orgId) {
      return response.forbidden()
    }
    const payload = await request.validateUsing(inviteAdvisorValidator)
    try {
      const dto = await this.organizationsService.inviteAdvisor({
        organizationId: orgId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      })
      return response.json(dto)
    } catch (err: any) {
      if (err.message?.includes('déjà utilisé')) {
        return response.badRequest({ message: err.message })
      }
      throw err
    }
  }
}
