import { CandidatProfileService } from '#services/candidat_profile_service'
import { candidatProfileUpdateValidator } from '#validators/profile/candidat_profile_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class CandidatOnboardingController {
  constructor(private candidatProfileService: CandidatProfileService) {}

  /**
   * PUT /dashboard/candidat/onboarding
   * Completes onboarding by persisting pre-support data and marking employee onboarded.
   */
  public async complete({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(candidatProfileUpdateValidator)

    await this.candidatProfileService.updateForUser(auth.user, payload as any, {
      forceOnboarded: true,
    })

    session.flash('success', 'Onboarding terminé. Bienvenue !')
    return response.redirect('/dashboard/candidat')
  }
}

