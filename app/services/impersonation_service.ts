import { ImpersonationNotAllowedError, NotImpersonatingError } from '#exceptions/auth_errors'
import User from '#models/user'
import { isSuperAdmin } from '#shared/helpers/roles'
import type { ImpersonationInfo, ImpersonationSession } from '#shared/types/auth/impersonation'

/**
 * Clé de session d'une prise d'identité (#143) : `{ impersonatorId, targetId }`.
 * Posée par `AuthController.impersonate`, retirée au retour, à la déconnexion
 * et à toute ouverture de session. Elle n'est honorée que si l'utilisateur
 * connecté est bien le compte pris (`targetId`) : une clé restée en session
 * après une déconnexion forcée ne donne jamais accès au compte du super admin.
 */
export const IMPERSONATOR_SESSION_KEY = 'impersonation'

/** Valeur à poser en session au début d'une prise d'identité. */
export function impersonationSession(impersonator: User, target: User): ImpersonationSession {
  return { impersonatorId: impersonator.id, targetId: target.id }
}

/** Id du super admin si la clé de session vise bien `currentUserId`, `null` sinon. */
function impersonatorIdFor(raw: unknown, currentUserId: number): number | null {
  if (!raw || typeof raw !== 'object') return null
  const { impersonatorId, targetId } = raw as Partial<ImpersonationSession>
  if (!Number.isInteger(impersonatorId) || targetId !== currentUserId) return null
  return impersonatorId as number
}

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
   * d'identité en cours sur le compte connecté → `NotImpersonatingError`.
   * `null` si le compte d'origine n'est plus un super admin actif : la
   * session est alors fermée.
   */
  public async resolveImpersonator(raw: unknown, currentUser: User): Promise<User | null> {
    const id = impersonatorIdFor(raw, currentUser.id)
    if (id === null) throw new NotImpersonatingError()
    const impersonator = await User.find(id)
    if (!impersonator || !isSuperAdmin(impersonator.role) || impersonator.disabledAt) return null
    return impersonator
  }

  /** Prop partagée du bandeau (#143), `null` hors prise d'identité du compte connecté. */
  public async bannerFor(raw: unknown, currentUser: User): Promise<ImpersonationInfo | null> {
    const id = impersonatorIdFor(raw, currentUser.id)
    if (id === null) return null
    const impersonator = await User.find(id)
    return impersonator ? { impersonatorName: impersonator.name } : null
  }
}
