import { AiAssistService } from '#services/ai_assist_service'
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
  constructor(private aiAssist: AiAssistService) {}

  /** `{ data: ExtractedCvData | null }` — `null` si l'IA est désactivée ou échoue. */
  async extractCv({ request, response }: HttpContext) {
    const { cv } = await request.validateUsing(extractCvValidator)
    const mimeType = `${cv.type}/${cv.subtype}`
    const data = await this.aiAssist.extractCv({ path: cv.tmpPath!, mimeType })
    return response.ok({ data })
  }

  async extractSkillMapping({ request, response, auth }: HttpContext) {
    const { text } = await request.validateUsing(extractSkillMappingValidator)
    const user = auth.getUserOrFail()
    return response.ok(await this.aiAssist.extractSkillMapping(text, user))
  }

  async suggestTargets({ request, response }: HttpContext) {
    const profile = await request.validateUsing(suggestTargetsValidator)
    return response.ok(await this.aiAssist.suggestTargets(profile))
  }
}
