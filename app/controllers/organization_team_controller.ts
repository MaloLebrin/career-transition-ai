import { TeamMembersService } from '#services/team_members_service'
import {
  reassignCandidatesValidator,
  updateMemberRoleValidator,
} from '#validators/organization/team_member_validators'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

const SETTINGS_URL = '/dashboard/conseiller/settings'

/**
 * Gestion de l'équipe du cabinet par son administrateur (#71). L'accès est
 * réservé par `middleware.admin()` sur les routes.
 */
@inject()
export default class OrganizationTeamController {
  constructor(private team: TeamMembersService) {}

  public async updateRole({ auth, params, request, response, session }: HttpContext) {
    const { role } = await request.validateUsing(updateMemberRoleValidator)
    await this.team.changeRole(auth.user!, Number(params.id), role)

    session.flash('success', 'Rôle mis à jour.')
    return response.redirect(SETTINGS_URL)
  }

  public async disable({ auth, params, response, session }: HttpContext) {
    await this.team.setDisabled(auth.user!, Number(params.id), true)

    session.flash('success', 'Accès retiré.')
    return response.redirect(SETTINGS_URL)
  }

  public async enable({ auth, params, response, session }: HttpContext) {
    await this.team.setDisabled(auth.user!, Number(params.id), false)

    session.flash('success', 'Accès rétabli.')
    return response.redirect(SETTINGS_URL)
  }

  public async reassign({ auth, params, request, response, session }: HttpContext) {
    const { toUserId } = await request.validateUsing(reassignCandidatesValidator)
    const moved = await this.team.reassignCandidates(auth.user!, Number(params.id), toUserId)

    session.flash(
      'success',
      moved === 0 ? 'Aucun candidat à réassigner.' : `${moved} candidat(s) réassigné(s).`
    )
    return response.redirect(SETTINGS_URL)
  }
}
