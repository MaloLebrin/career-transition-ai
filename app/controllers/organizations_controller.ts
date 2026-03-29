import Organization from '#models/organization'
import { OrganizationsService } from '#services/organizations_service'
import { updateOrganizationValidator } from '#validators/organization/organization_update_validator'
import { inviteAdvisorValidator } from '#validators/user/invite_advisor_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { AdvisorService } from '../services/advisor_service.js'

@inject()
export default class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    private advisorService: AdvisorService
  ) { }

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
    const baseUrl = `${request.protocol()}://${request.hostname()}`
    await this.advisorService.inviteAdvisor(
      {
        organizationId: orgId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
      baseUrl
    )
    session.flash('success', 'Collaborateur invité.')
    return response.redirect('/dashboard/conseiller/settings')
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

    return (inertia as any).render('dashboard/conseiller/settings/Home', {
      organization,
      members,
    })
  }
}
