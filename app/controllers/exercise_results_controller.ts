import { ExerciseResultsService } from '#services/exercise_results_service'
import { fetchExerciseDraftValidator, saveExerciseDraftValidator } from '#validators/exercise_draft_validator'
import { saveExerciseResultValidator } from '#validators/exercise_result_save_validator'
import ExerciseResult, { EXERCICE_RESULTS_TYPES } from '#models/exercise_result'
import Employee from '#models/employee'
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

  /**
   * Inertia form: save MOTIVATION draft then redirect back.
   */
  public async saveDraftFromDashboard({ auth, params, request, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = Number(params.id)
    const payload = await request.validateUsing(saveExerciseDraftValidator)

    await this.service.saveDraft({
      employeeId,
      type: payload.type,
      data: payload.data,
    })

    return response.redirect().back()
  }

  /**
   * Inertia form: save MOTIVATION result then redirect to employee detail.
   */
  public async storeFromDashboard({ auth, params, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = Number(params.id)
    const payload = await request.validateUsing(saveExerciseResultValidator)

    await this.service.saveResult({
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

    session.flash('success', 'Exercice MOTIVATION enregistré.')
    return response.redirect(`/dashboard/employees/${employeeId}`)
  }
  /**
   * Inertia page: exercise with initial draft/result for MOTIVATION.
   */
  public async showDashboard({ auth, params, inertia, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = Number(params.id)
    const typeParam = String(params.type).toLowerCase()

    // For now, only handle MOTIVATION specifically; others fall back without draft
    if (typeParam !== EXERCICE_RESULTS_TYPES.MOTIVATION) {
      return (inertia as any).render('dashboard/Exercise', {
        type: params.type,
        employeeId: String(employeeId),
        initialMotivationDraft: null,
      })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', auth.user.organizationId)
      .preload('exerciseResults')
      .firstOrFail()

    const draft = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .andWhere('status', 'draft')
      .orderBy('updatedAt', 'desc')
      .first()

    const initialMotivationDraft = draft
      ? {
          employeeId: employee.id,
          type: EXERCICE_RESULTS_TYPES.MOTIVATION,
          lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
          data: draft.data,
        }
      : null

    return (inertia as any).render('dashboard/Exercise', {
      type: params.type,
      employeeId: String(employee.id),
      initialMotivationDraft,
    })
  }
}

