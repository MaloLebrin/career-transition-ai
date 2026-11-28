import { AuthService } from '#services/auth_service'
import { CandidatProfileService } from '#services/candidat_profile_service'
import { IMPERSONATOR_SESSION_KEY, ImpersonationService } from '#services/impersonation_service'
import { loginValidator } from '#validators/auth/auth_login_validator'
import { registerCandidateValidator } from '#validators/auth/auth_register_candidate_validator'
import { registerValidator } from '#validators/auth/auth_register_validator'
import { candidatProfileUpdateValidator } from '#validators/profile/candidat_profile_update_validator'
import { userProfileUpdateValidator } from '#validators/user/user_profile_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthController {
  constructor(
    private authService: AuthService,
    private candidatProfileService: CandidatProfileService,
    private impersonation: ImpersonationService = new ImpersonationService()
  ) {}

  public async login({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const user = await this.authService.verifyCredentials(payload.email, payload.password)
    await auth.use('web').login(user)

    return response.redirect().status(303).toPath('/dashboard')
  }

  public async register({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    await this.authService.register(payload)
    const user = await this.authService.verifyCredentials(payload.email, payload.password)
    await auth.use('web').login(user)

    return response.redirect().status(303).toPath('/dashboard')
  }

  /**
   * POST /auth/register/candidat (#93) : inscription d'un particulier, puis
   * session ouverte. `/dashboard` l'envoie vers l'onboarding candidat
   * (`checkOnboarding()`), la fiche n'étant pas encore onboardée.
   */
  public async registerCandidate({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(registerCandidateValidator)
    // La case CGU est validée puis horodatée par le service : elle ne fait pas partie de l'entrée.
    await this.authService.registerCandidate({
      email: payload.email,
      password: payload.password,
      name: payload.name,
    })
    const user = await this.authService.verifyCredentials(payload.email, payload.password)
    await auth.use('web').login(user)

    return response.redirect().status(303).toPath('/dashboard')
  }

  public async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.forget(IMPERSONATOR_SESSION_KEY)
    return response.redirect('/')
  }

  /**
   * POST /auth/impersonate/:id — super admin. Son id reste en session pour
   * « Revenir à mon compte » (#143).
   */
  public async impersonate({ auth, params, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const targetUser = await this.impersonation.findTarget(actor, Number(params.id))
    if (!targetUser) {
      session.flash('error', "Utilisateur introuvable pour l'impersonation.")
      return response.redirect('/dashboard/super-admin')
    }

    await auth.use('web').login(targetUser)
    session.put(IMPERSONATOR_SESSION_KEY, actor.id)
    session.flash('success', `Vous êtes maintenant connecté en tant que ${targetUser.name}.`)
    return response.redirect('/dashboard')
  }

  /**
   * POST /auth/impersonation/leave — fin de la prise d'identité (#143) : la
   * session redevient celle du super admin, sans se reconnecter. Compte
   * d'origine supprimé, désactivé ou rétrogradé → déconnexion.
   */
  public async leaveImpersonation({ auth, response, session }: HttpContext) {
    const impersonator = await this.impersonation.resolveImpersonator(
      session.get(IMPERSONATOR_SESSION_KEY)
    )
    session.forget(IMPERSONATOR_SESSION_KEY)

    if (!impersonator) {
      await auth.use('web').logout()
      session.flash('error', 'Votre compte d’origine n’est plus disponible. Reconnectez-vous.')
      return response.redirect('/auth/login')
    }

    await auth.use('web').login(impersonator)
    session.flash('success', 'Vous êtes de retour sur votre compte.')
    return response.redirect('/dashboard/super-admin')
  }

  /**
   * Inertia form: update current user's profile (name now, email after confirmation, #143)
   * then redirect with flash.
   */
  public async updateFromDashboard({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }
    const payload = await request.validateUsing(userProfileUpdateValidator)
    const { pendingEmail } = await this.authService.updateProfile(user, payload)
    session.flash(
      'success',
      pendingEmail
        ? `Profil mis à jour. Un lien de confirmation a été envoyé à ${pendingEmail} : votre adresse changera après votre clic.`
        : 'Profil mis à jour.'
    )
    return response.redirect('/dashboard/conseiller/settings')
  }

  /**
   * Candidat only: update current user profile (name, email) and linked employee (name, currentRole, targetRole, summary).
   */
  public async updateProfileCandidat({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(candidatProfileUpdateValidator)

    await this.candidatProfileService.updateForUser(auth.user, payload as any)

    session.flash('success', 'Profil mis à jour.')
    // Formulaire d'identité de la page profil (#70) : on y reste.
    return response.redirect().back()
  }
}
