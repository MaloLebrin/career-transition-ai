import { ImpersonationNotAllowedError, NotImpersonatingError } from '#exceptions/auth_errors'
import User from '#models/user'
import { isSuperAdmin } from '#shared/helpers/roles'
import type { ImpersonationInfo } from '#shared/types/auth/impersonation'

/**
 * Clé de session qui garde l'id du super admin pendant une prise d'identité
 * (#143). Posée par `AuthController.impersonate`, retirée au retour ou à la
 * déconnexion.
 */
export const IMPERSONATOR_SESSION_KEY = 'impersonator_id'

/**
 * Prise d'identité par le super admin (`POST /auth/impersonate/:id`) et retour
 * à son compte (`POST /auth/impersonation/leave`, #143). Le contrôleur ouvre
 * les sessions ; ce service dit qui peut être pris et vers qui revenir.
 */
export class ImpersonationService {
  /**
   * Compte dont `actor` peut prendre l'identité, `null` s'il n'existe pas.
   * Refusé : soi-même, un autre super admin (pas d'imbrication) et un compte
   * désactivé (`AuthMiddleware` couperait la session aussitôt).
   */
  public async findTarget(actor: User, targetId: number): Promise<User | null> {
    if (!Number.isInteger(targetId)) return null
    const target = await User.find(targetId)
    if (!target) return null
    if (target.id === actor.id || isSuperAdmin(target.role) || target.disabledAt) {
      throw new ImpersonationNotAllowedError()
    }
    return target
  }

  /**
   * Super admin vers lequel revenir, lu depuis la session. Aucune prise
   * d'identité en cours → `NotImpersonatingError`. `null` si le compte
   * d'origine n'est plus un super admin actif : la session est alors fermée.
   */
  public async resolveImpersonator(rawId: unknown): Promise<User | null> {
    const id = Number(rawId)
    if (rawId === undefined || rawId === null || !Number.isInteger(id)) {
      throw new NotImpersonatingError()
    }
    const impersonator = await User.find(id)
    if (!impersonator || !isSuperAdmin(impersonator.role) || impersonator.disabledAt) return null
    return impersonator
  }

  /** Prop partagée du bandeau (#143), `null` hors prise d'identité. */
  public async bannerFor(rawId: unknown): Promise<ImpersonationInfo | null> {
    const id = Number(rawId)
    if (rawId === undefined || rawId === null || !Number.isInteger(id)) return null
    const impersonator = await User.find(id)
    return impersonator ? { impersonatorName: impersonator.name } : null
  }
}
