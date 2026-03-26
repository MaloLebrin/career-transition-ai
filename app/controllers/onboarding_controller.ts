import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { onboardingSetPasswordValidator } from '#validators/auth/onboarding_set_password_validator'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class OnboardingController {
  /**
   * GET /onboarding/:token — Show set-password page (guest).
   */
  public async show({ params, inertia }: HttpContext) {
    const tokenRecord = await OnboardingToken.query()
      .where('token', params.token)
      .preload('user')
      .first()

    if (!tokenRecord || !tokenRecord.user) {
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
    const tokenRecord = await OnboardingToken.query()
      .where('token', params.token)
      .preload('user')
      .first()

    if (!tokenRecord || !tokenRecord.user) {
      session.flash('error', 'Lien invalide ou expiré.')
      return response.redirect('/auth/login')
    }

    if (!tokenRecord.isValid()) {
      session.flash('error', 'Ce lien a déjà été utilisé ou a expiré.')
      return response.redirect('/auth/login')
    }

    const payload = await request.validateUsing(onboardingSetPasswordValidator)

    const user = tokenRecord.user as User
    user.password = await hash.make(payload.password)
    await user.save()

    tokenRecord.usedAt = DateTime.now()
    await tokenRecord.save()

    await auth.use('web').login(user)
    session.flash('success', 'Mot de passe créé. Bienvenue !')
    return response.redirect('/dashboard/candidat')
  }
}
