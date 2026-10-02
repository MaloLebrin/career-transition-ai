import { AiAssistService } from '#services/ai_assist_service'
import { CandidateDocumentsService } from '#services/candidate_documents_service'
import {
  extractCvValidator,
  extractSkillMappingValidator,
  suggestTargetsValidator,
} from '#validators/ai_assist/ai_assist_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Endpoints JSON d'assistance IA appelés par `inertia/helpers/ai` (issue #18).
 * Réservés aux utilisateurs connectés et limités par `throttleAi`.
 */
@inject()
export default class AiAssistController {
  constructor(
    private aiAssist: AiAssistService,
    private candidateDocuments: CandidateDocumentsService
  ) {}

  /**
   * `{ data: ExtractedCvData | null }` — `null` si l'IA est désactivée ou échoue.
   * Après une extraction réussie, le CV d'un candidat est conservé dans ses
   * documents (issue #50) ; un échec de stockage ne change pas la réponse.
   */
  async extractCv({ auth, request, response }: HttpContext) {
    const { cv } = await request.validateUsing(extractCvValidator)
    const mimeType = `${cv.type}/${cv.subtype}`
    const data = await this.aiAssist.extractCv({ path: cv.tmpPath!, mimeType })
    if (data) await this.candidateDocuments.storeImportedCv(auth.getUserOrFail(), cv)
    return response.ok({ data })
  }

  async extractSkillMapping({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await this.aiAssist.assertResultsAccess(user)
    const { text } = await request.validateUsing(extractSkillMappingValidator)
    return response.ok(await this.aiAssist.extractSkillMapping(text, user))
  }

  async suggestTargets({ request, response, auth }: HttpContext) {
    await this.aiAssist.assertResultsAccess(auth.getUserOrFail())
    const profile = await request.validateUsing(suggestTargetsValidator)
    return response.ok(await this.aiAssist.suggestTargets(profile))
  }
}
