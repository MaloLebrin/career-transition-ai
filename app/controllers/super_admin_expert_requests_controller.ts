import { ExpertRequestsService } from '#services/expert_requests_service'
import { PlatformTeamService } from '#services/platform_team_service'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { assignExpertValidator } from '#validators/expert_request/assign_expert_validator'
import { declineExpertRequestValidator } from '#validators/expert_request/decline_expert_request_validator'
import { invitePlatformMemberValidator } from '#validators/super_admin/invite_platform_member_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export const EXPERT_ASSIGNED_MESSAGE = 'Expert assigné : le candidat et l’expert sont prévenus.'
export const EXPERT_REQUEST_DECLINED_MESSAGE = 'Demande refusée : le candidat est prévenu.'
export const TEAM_MEMBER_INVITED_MESSAGE =
  'Membre invité : un e-mail d’activation lui a été envoyé.'

/** Back-office super admin des demandes d'accompagnement et de l'équipe interne (#105). */
@inject()
export default class SuperAdminExpertRequestsController {
  constructor(
    private expertRequests: ExpertRequestsService,
    private platformTeam: PlatformTeamService
  ) {}

  /** GET /dashboard/super-admin/expert-requests */
  public async index({ inertia }: HttpContext) {
    const [requests, experts] = await Promise.all([
      this.expertRequests.listForAdmin(),
      this.platformTeam.listMembers(),
    ])
    return inertia.render('dashboard/admin/expert_requests/Index', { requests, experts })
  }

  /** POST /dashboard/super-admin/expert-requests/:id/assign */
  public async assign({ auth, params, request, response, session }: HttpContext) {
    const { expertUserId } = await request.validateUsing(assignExpertValidator)
    await this.expertRequests.assign(auth.getUserOrFail(), {
      requestId: Number(params.id),
      expertUserId,
    })
    session.flash('success', EXPERT_ASSIGNED_MESSAGE)
    return response.redirect(EXPERT_REQUEST_PATHS.admin)
  }

  /** POST /dashboard/super-admin/expert-requests/:id/decline */
  public async decline({ auth, params, request, response, session }: HttpContext) {
    const { reason } = await request.validateUsing(declineExpertRequestValidator)
    await this.expertRequests.decline(auth.getUserOrFail(), {
      requestId: Number(params.id),
      reason,
    })
    session.flash('success', EXPERT_REQUEST_DECLINED_MESSAGE)
    return response.redirect(EXPERT_REQUEST_PATHS.admin)
  }

  /** GET /dashboard/super-admin/team */
  public async team({ inertia }: HttpContext) {
    return inertia.render('dashboard/admin/team/Index', {
      members: await this.platformTeam.listMembers(),
    })
  }

  /** POST /dashboard/super-admin/team */
  public async invite({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(invitePlatformMemberValidator)
    await this.platformTeam.invite(payload)
    session.flash('success', TEAM_MEMBER_INVITED_MESSAGE)
    return response.redirect(EXPERT_REQUEST_PATHS.team)
  }
}
