import { ExerciseResultsService } from '#services/exercise_results_service'
import { fetchExerciseDraftValidator, saveExerciseDraftValidator } from '#validators/exercise_draft_validator'
import { saveExerciseResultValidator } from '#validators/exercise_result_save_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ExerciseResultsController {
  constructor(private service: ExerciseResultsService) {}

  public async store({ params, request, response }: HttpContext) {
    const employeeId = Number(params.id)
    const payload = await request.validateUsing(saveExerciseResultValidator)

    const dto = await this.service.saveResult({
      employeeId,
      type: payload.type,
      status: payload.status,
      date: payload.date,
      duration: payload.duration,
      data: payload.data,
      quantitativeScore: payload.quantitativeScore,
      qualitativeAnalysis: payload.qualitativeAnalysis,
      plan: payload.plan,
    })

    return response.json(dto)
  }

  public async saveDraft({ request, response }: HttpContext) {
    const payload = await request.validateUsing(saveExerciseDraftValidator)

    await this.service.saveDraft({
      employeeId: Number(payload.employeeId),
      type: payload.type,
      data: payload.data,
    })

    return response.noContent()
  }

  public async fetchDraft({ request, response }: HttpContext) {
    const payload = await request.validateUsing(fetchExerciseDraftValidator)

    const draft = await this.service.fetchDraft({
      employeeId: Number(payload.employeeId),
      type: payload.type,
      data: {},
    })

    return response.json(draft)
  }
}

