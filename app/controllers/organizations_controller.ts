import { OrganizationsService } from '#services/organizations_service'
import { inviteAdvisorValidator } from '#validators/invite_advisor_validator'
import { updateOrganizationValidator } from '#validators/organization_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Organization from '#models/organization'

@inject()
export default class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  /** Returns the authenticated user's organization (no id in URL). */
  public async current({ auth, response }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = auth.user.organizationId
    const dto = await this.organizationsService.getById(orgId)
    if (!dto) return response.notFound()
    return response.json(dto)
  }

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

  /**
   * Inertia form: update current user's organization then redirect with flash.
   */
  public async updateFromDashboard({ auth, request, response, session }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = auth.user.organizationId
    const org = await Organization.findOrFail(orgId)
    const payload = await request.validateUsing(updateOrganizationValidator)
    await this.organizationsService.update(org, payload)
    session.flash('success', 'Cabinet mis à jour.')
    return response.redirect('/dashboard/conseiller/settings')
  }

  /**
   * Inertia form: invite advisor to current user's organization then redirect with flash.
   */
  public async storeAdvisorFromDashboard({ auth, request, response, session }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const orgId = auth.user.organizationId
    const payload = await request.validateUsing(inviteAdvisorValidator)
    try {
      await this.organizationsService.inviteAdvisor({
        organizationId: orgId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      })
      session.flash('success', 'Collaborateur invité.')
      return response.redirect('/dashboard/conseiller/settings')
    } catch (err: any) {
      if (err.message?.includes('déjà utilisé')) {
        session.flash('error', err.message)
        return response.redirect('/dashboard/conseiller/settings')
      }
      throw err
    }
  }

  /**
   * Inertia page: dashboard settings with organization and advisors.
   */
  public async settingsDashboard({ auth, inertia, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const orgId = auth.user.organizationId
    const organization = await this.organizationsService.getById(orgId)
    if (!organization) {
      return response.notFound()
    }
    const members = await this.organizationsService.listAdvisors(orgId)

    return (inertia as any).render('dashboard/Settings', {
      organization,
      members,
    })
  }
}
