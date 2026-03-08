import { AuthService } from '#services/auth_service'
import { EmployeesService } from '#services/employees_service'
import { loginValidator } from '#validators/auth_login_validator'
import { registerValidator } from '#validators/auth_register_validator'
import { userProfileUpdateValidator } from '#validators/user_profile_update_validator'
import { candidatProfileUpdateValidator } from '#validators/candidat_profile_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthController {
  constructor(
    private authService: AuthService,
    private employeesService: EmployeesService
  ) {}

  public async me({ auth, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    const dto = this.authService.toSession(auth.user)
    return response.json(dto)
  }

  public async login({ request, auth, response, session }: HttpContext) {
    const wantsJson = request.header('accept')?.includes('application/json')
    try {
      const payload = await request.validateUsing(loginValidator)
      const user = await this.authService.verifyCredentials(payload.email, payload.password)
      await auth.use('web').login(user)
      if (wantsJson) {
        const dto = this.authService.toSession(user)
        return response.json(dto)
      }
      return response.redirect().status(303).toPath('/dashboard')
    } catch (error: any) {
      const message = error.message || 'Identifiants invalides'
      if (wantsJson) {
        return response.unauthorized({ message })
      }
      session.flash('error', message)
      return response.redirect().back()
    }
  }

  public async register({ request, auth, response, session }: HttpContext) {
    const wantsJson = request.header('accept')?.includes('application/json')
    try {
      const payload = await request.validateUsing(registerValidator)
      const dto = await this.authService.register(payload)
      const user = await this.authService.verifyCredentials(payload.email, payload.password)
      await auth.use('web').login(user)
      if (wantsJson) {
        return response.json(dto)
      }
      return response.redirect().status(303).toPath('/dashboard')
    } catch (error: any) {
      const message = error.message || 'Erreur lors de la création du compte.'
      if (wantsJson) {
        return response.badRequest({ message })
      }
      session.flash('error', message)
      return response.redirect().back()
    }
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }

  /**
   * Super admin only: impersonate another user by id.
   */
  public async impersonate({ auth, params, response, session }: HttpContext) {
    const current = auth.user
    if (!current) {
      return response.unauthorized()
    }
    if (current.role !== 'super_admin') {
      return response.forbidden()
    }

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
   * Super admin only: reset another user's password to a temporary one.
   * In un contexte réel, on enverrait un email de réinitialisation ; ici, on fixe un mot de passe simple.
   */
  public async resetPassword({ auth, params, response, session }: HttpContext) {
    const current = auth.user
    if (!current) {
      return response.unauthorized()
    }
    if (current.role !== 'super_admin') {
      return response.forbidden()
    }

    const targetId = Number(params.id)
    const result = await this.authService.resetPasswordForUser(targetId)
    if (!result) {
      session.flash('error', 'Utilisateur introuvable pour la réinitialisation.')
      return response.redirect('/dashboard/super-admin')
    }

    session.flash(
      'success',
      `Mot de passe réinitialisé pour ${result.user.name}. Nouveau mot de passe temporaire: ${result.temporaryPassword}`
    )
    return response.redirect('/dashboard/super-admin')
  }

  /**
   * Inertia form: update current user's profile (name, email) then redirect with flash.
   */
  public async updateFromDashboard({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(userProfileUpdateValidator)

    try {
      await this.authService.updateProfile(auth.user, payload)
      session.flash('success', 'Profil mis à jour.')
      return response.redirect('/dashboard/conseiller/settings')
    } catch (error: any) {
      if (error.message?.includes('déjà utilisé')) {
        session.flash('error', error.message)
        return response.redirect('/dashboard/conseiller/settings')
      }
      throw error
    }
  }

  /**
   * Candidat only: update current user profile (name, email) and linked employee (name, currentRole, targetRole, summary).
   */
  public async updateProfileCandidat({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(candidatProfileUpdateValidator)

    try {
      if (payload.name !== undefined || payload.email !== undefined) {
        await this.authService.updateProfile(auth.user, {
          name: payload.name ?? auth.user.name,
          email: payload.email ?? auth.user.email,
        })
      }

      const employee = await this.employeesService.getEmployeeForUser(auth.user)
      this.employeesService.applyUpdate(employee, {
        name: payload.name ?? employee.name,
        currentRole: payload.currentRole ?? employee.currentRole,
        targetRole: payload.targetRole ?? employee.targetRole,
        summary: payload.summary ?? employee.summary,
        onboarded: payload.onboarded ?? employee.onboarded,
      })
      await employee.save()

      session.flash('success', 'Profil mis à jour.')
      return response.redirect('/dashboard/candidat')
    } catch (error: any) {
      if (error.message?.includes('déjà utilisé') || error.message?.includes('Profil candidat')) {
        session.flash('error', error.message)
        return response.redirect('/dashboard/candidat/profile')
      }
      throw error
    }
  }
}
