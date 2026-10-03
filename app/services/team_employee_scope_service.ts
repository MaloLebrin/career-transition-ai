import type User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'

/**
 * Périmètre des fiches candidat visibles par un membre d'équipe, à passer à
 * `Employee.query().where(teamEmployeeScope(user))`.
 *
 * Toujours borné à `user.organizationId` (autre organisation → 404). Dans
 * l'organisation plateforme, qui porte aussi les particuliers B2C, un
 * conseiller ou un expert ne voit que les candidats qui lui sont assignés
 * (`employees.advisor_id`) ; l'admin garde la vue d'ensemble. Hors plateforme,
 * le comportement reste celui du cabinet (toute l'organisation).
 */
export function teamEmployeeScope(user: Pick<User, 'id' | 'role' | 'organizationId'>) {
  const restricted = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.EXPERT
  return (query: any) => {
    query.where('organizationId', user.organizationId)
    if (restricted) {
      query.where((scope: any) =>
        scope
          .where('advisorId', user.id)
          .orWhereRaw(
            'NOT EXISTS (SELECT 1 FROM organizations WHERE organizations.id = employees.organization_id AND organizations.is_platform = true)'
          )
      )
    }
  }
}
