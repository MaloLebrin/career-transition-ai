import { AuthService } from '#services/auth_service'
import { CandidatProfileService } from '#services/candidat_profile_service'
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
    private candidatProfileService: CandidatProfileService
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

  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }

  public async impersonate({ auth, params, response, session }: HttpContext) {
    const targetId = Number(params.id)
    const targetUser = await this.authService.findUserById(targetId)
    if (!targetUser) {
      session.flash('error', "Utilisateur introuvable pour l'impersonation.")
      return response.redirect('/dashboard/super-admin')
    }

    await auth.use('web').login(targetUser)
    session.flash('success', `Vous êtes maintenant connecté en tant que ${targetUser.name}.`)
    return response.redirect('/dashboard')
  }

  /**
   * Inertia form: update current user's profile (name, email) then redirect with flash.
   */
  public async updateFromDashboard({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }
    const payload = await request.validateUsing(userProfileUpdateValidator)
    await this.authService.updateProfile(user, payload)
    session.flash('success', 'Profil mis à jour.')
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
