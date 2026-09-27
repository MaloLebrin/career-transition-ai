import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { isConseillerDashboardRole } from '#shared/helpers/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { onboardingSetPasswordValidator } from '#validators/auth/onboarding_set_password_validator'
import type { HttpContext } from '@adonisjs/core/http'
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
    // En clair : le hook `beforeSave` de `withAuthFinder` le hashe. Un `hash.make()`
    // ici le faisait hasher deux fois — le mot de passe choisi ne fonctionnait pas.
    user.password = payload.password
    user.onboardingCompletedAt = DateTime.now()
    await user.save()

    tokenRecord.usedAt = DateTime.now()
    await tokenRecord.save()

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
