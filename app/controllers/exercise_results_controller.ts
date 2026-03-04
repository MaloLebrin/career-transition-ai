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
   * Inertia page: exercise with initial draft/result for supported types.
   */
  public async showDashboard({ auth, params, inertia, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = Number(params.id)
    const typeParam = String(params.type).toLowerCase()

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', auth.user.organizationId)
      .preload('exerciseResults')
      .firstOrFail()

    const draftTypes = [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
      EXERCICE_RESULTS_TYPES.VALUES,
      EXERCICE_RESULTS_TYPES.PERSONALITY,
      EXERCICE_RESULTS_TYPES.LIFE_CURVE,
      EXERCICE_RESULTS_TYPES.TARGETING,
      EXERCICE_RESULTS_TYPES.DISC,
      EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
      EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL,
    ] as const

    const initialDrafts: Record<string, any> = {}
    for (const exerciseType of draftTypes) {
      if (typeParam !== exerciseType) continue
      const draft = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'draft')
        .orderBy('updatedAt', 'desc')
        .first()
      initialDrafts[exerciseType] = draft
        ? {
            employeeId: employee.id,
            type: exerciseType,
            lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
            data: draft.data,
          }
        : null
      break
    }

    return (inertia as any).render('dashboard/Exercise', {
      type: params.type,
      employeeId: String(employee.id),
      initialMotivationDraft: initialDrafts[EXERCICE_RESULTS_TYPES.MOTIVATION] ?? null,
      initialValuesDraft: initialDrafts[EXERCICE_RESULTS_TYPES.VALUES] ?? null,
      initialPersonalityDraft: initialDrafts[EXERCICE_RESULTS_TYPES.PERSONALITY] ?? null,
      initialLifeCurveDraft: initialDrafts[EXERCICE_RESULTS_TYPES.LIFE_CURVE] ?? null,
      initialTargetingDraft: initialDrafts[EXERCICE_RESULTS_TYPES.TARGETING] ?? null,
      initialDiscDraft: initialDrafts[EXERCICE_RESULTS_TYPES.DISC] ?? null,
      initialSkillMappingDraft: initialDrafts[EXERCICE_RESULTS_TYPES.SKILL_MAPPING] ?? null,
      initialCircleOfControlDraft: initialDrafts[EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL] ?? null,
    })
  }
}

