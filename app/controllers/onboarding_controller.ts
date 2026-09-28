import { OnboardingTokensService } from '#services/onboarding_tokens_service'
import { isConseillerDashboardRole } from '#shared/helpers/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { onboardingSetPasswordValidator } from '#validators/auth/onboarding_set_password_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

@inject()
export default class OnboardingController {
  constructor(private onboardingTokens: OnboardingTokensService) {}

  /**
   * GET /onboarding/:token — Show set-password page (guest).
   */
  public async show({ params, inertia }: HttpContext) {
    const tokenRecord = await this.onboardingTokens.findByPlainToken(String(params.token))

    if (!tokenRecord) {
      return (inertia as any).render('onboarding/InvalidToken', {})
    }

    if (!tokenRecord.isValid()) {
      const expired = !tokenRecord.usedAt && tokenRecord.expiresAt < DateTime.now()
      return (inertia as any).render('onboarding/InvalidToken', { expired })
    }

    return (inertia as any).render('onboarding/SetPassword', {
      token: params.token,
      userName: tokenRecord.user.name,
    })
  }

  /**
   * POST /onboarding/:token — Set password, consume token, log in, redirect to dashboard.
   */
  public async submit({ params, request, response, auth, session }: HttpContext) {
    const tokenRecord = await this.onboardingTokens.findByPlainToken(String(params.token))

    if (!tokenRecord) {
      session.flash('error', 'Lien invalide ou expiré.')
      return response.redirect('/auth/login')
    }

    if (!tokenRecord.isValid()) {
      session.flash('error', 'Ce lien a déjà été utilisé ou a expiré.')
      return response.redirect('/auth/login')
    }

    const payload = await request.validateUsing(onboardingSetPasswordValidator)
    const user = await this.onboardingTokens.consume(tokenRecord, payload.password)

    await auth.use('web').login(user)
    session.flash('success', 'Mot de passe créé. Bienvenue !')
    if (user.role === USERS_ROLES.EMPLOYEE) {
      return response.redirect('/dashboard/candidat')
    }
    if (isConseillerDashboardRole(user.role)) {
      return response.redirect('/dashboard/conseiller')
    }
    if (user.role === USERS_ROLES.SUPER_ADMIN) {
      return response.redirect('/dashboard/super-admin')
    }
    return response.redirect('/dashboard')
  }
}
