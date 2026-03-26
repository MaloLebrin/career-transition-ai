import Organization from '#models/organization'
import { OrganizationsService } from '#domains/organizations/services/organizations_service'
import { updateOrganizationValidator } from '#validators/organization/organization_update_validator'
import { inviteAdvisorValidator } from '#validators/user/invite_advisor_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

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

    return (inertia as any).render('dashboard/conseiller/settings/Home', {
      organization,
      members,
    })
  }
}

