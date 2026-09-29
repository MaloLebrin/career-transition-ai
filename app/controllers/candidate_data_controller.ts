import { CandidateDataRequestsService } from '#services/candidate_data_requests_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Droits RGPD du candidat en libre-service (#70) : export de ses données et
 * demande d'effacement. Routes sous `auth()` + `candidate()`.
 */
@inject()
export default class CandidateDataController {
  constructor(private dataRequests: CandidateDataRequestsService) {}

  /** GET /dashboard/candidat/data/export — archive ZIP (dossier PDF + donnees.json + documents). */
  async export({ auth, response }: HttpContext) {
    const { stream, fileName } = await this.dataRequests.export(auth.user!)
    response.header('Content-Type', 'application/zip')
    response.header('Content-Disposition', `attachment; filename="${fileName}"`)
    response.header('Cache-Control', 'no-store')
    response.stream(stream)
  }

  /** POST /dashboard/candidat/data/erasure-request */
  async requestErasure({ auth, response, session }: HttpContext) {
    await this.dataRequests.requestErasure(auth.user!)
    session.flash(
      'success',
      'Demande d’effacement enregistrée : elle sera traitée sous un mois, vous serez prévenu par e-mail.'
    )
    return response.redirect().back()
  }
}
