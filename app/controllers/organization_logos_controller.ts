import { BrandingService } from '#services/branding_service'
import { uploadOrganizationLogoValidator } from '#validators/organization/organization_logo_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Logo de l'organisation de l'utilisateur connecté (réglages du cabinet, issue #51). */
@inject()
export default class OrganizationLogosController {
  constructor(private brandingService: BrandingService) {}

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { logo } = await request.validateUsing(uploadOrganizationLogoValidator)
    await this.brandingService.uploadLogo(user.organizationId, logo)
    session.flash('success', 'Logo mis à jour.')
    return response.redirect().back()
  }

  async destroy({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.brandingService.deleteLogo(user.organizationId)
    session.flash('success', 'Logo supprimé.')
    return response.redirect().back()
  }
}
