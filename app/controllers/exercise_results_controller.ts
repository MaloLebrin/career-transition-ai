import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import { EmployeesService } from '#services/employees_service'
import { ExerciseResultsService } from '#services/exercise_results_service'
import {
  fetchExerciseDraftValidator,
  saveExerciseDraftValidator,
} from '#validators/exercise_draft_validator'
import { saveExerciseResultValidator } from '#validators/exercise_result_save_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { EXERCICE_RESULTS_TYPES, EXERCISE_LIST } from '../../shared/constants/exercises'

/** Map exercise type (slug) to dedicated Inertia page. Unknown type falls back to dashboard/Exercise. */
const EXERCISE_TYPE_TO_PAGE: Record<string, string> = {
  [EXERCICE_RESULTS_TYPES.MOTIVATION]: 'dashboard/exercises/Motivation',
  [EXERCICE_RESULTS_TYPES.VALUES]: 'dashboard/exercises/Values',
  [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: 'dashboard/exercises/LifeCurve',
  [EXERCICE_RESULTS_TYPES.PERSONALITY]: 'dashboard/exercises/Personality',
  [EXERCICE_RESULTS_TYPES.TARGETING]: 'dashboard/exercises/Targeting',
  [EXERCICE_RESULTS_TYPES.DISC]: 'dashboard/exercises/DISC',
  [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: 'dashboard/exercises/SkillMapping',
  [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: 'dashboard/exercises/CircleOfControl',
}

@inject()
export default class ExerciseResultsController {
  constructor(
    private service: ExerciseResultsService,
    private employeesService: EmployeesService
  ) { }

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
   * Inertia form: save exercise result then redirect to employee detail.
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

    // Message de succès dynamique selon le type d'exercice
    const typeLabelMap: Record<string, string> = {
      [EXERCICE_RESULTS_TYPES.MOTIVATION]: 'Motivation',
      [EXERCICE_RESULTS_TYPES.VALUES]: 'Valeurs',
      [EXERCICE_RESULTS_TYPES.PERSONALITY]: 'Personnalité',
      [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: 'Courbe de vie',
      [EXERCICE_RESULTS_TYPES.TARGETING]: 'Ciblage',
      [EXERCICE_RESULTS_TYPES.DISC]: 'DISC',
      [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: 'Cartographie des compétences',
      [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: 'Cercle de contrôle',
    }

    const typeKey = String(payload.type)
    const label = typeLabelMap[typeKey] ?? 'Exercice'
    session.flash('success', `Exercice ${label} enregistré.`)
    return response.redirect(`/dashboard/conseiller/employees/${employeeId}`)
  }
  /**
   * Candidat: Inertia page listing all exercises (no :type).
   */
  public async exerciseListCandidat({ auth, inertia, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    return (inertia as any).render('dashboard/exercises/CandidatList', {
      exercises: EXERCISE_LIST,
    })
  }

  /**
   * Conseiller: Inertia page listing exercise results for an employee (only realized exercises).
   */
  public async exerciseListConseiller({ auth, params, inertia, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    const employeeId = Number(params.id)
    let employee: Employee
    try {
      employee = await Employee.query()
        .where('id', employeeId)
        .where('organizationId', auth.user.organizationId)
        .preload('exerciseResults')
        .firstOrFail()
    } catch {
      session.flash('error', 'Candidat introuvable.')
      return response.redirect('/dashboard/conseiller/employees')
    }
    const titleBySlug: Record<string, string> = {}
    for (const entry of EXERCISE_LIST) {
      titleBySlug[entry.slug] = entry.title
    }
    const byType = new Map<string, { date: string; status: string }>()
    for (const r of employee.exerciseResults || []) {
      const slug = String(r.type)
      const existing = byType.get(slug)
      const dateStr = r.date ? r.date.toISO()! : (r.updatedAt?.toISO() ?? '')
      if (!existing || dateStr > existing.date) {
        byType.set(slug, { date: dateStr, status: r.status })
      }
    }
    const results = Array.from(byType.entries())
      .map(([slug, { date, status }]) => ({
        slug,
        title: titleBySlug[slug] ?? slug,
        date,
        status,
      }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return (inertia as any).render('dashboard/exercises/ConseillerList', {
      employeeId: String(employeeId),
      results,
    })
  }

  /**
   * Conseiller: Inertia page showing one exercise result (read-only) for an employee.
   */
  public async showExerciseResultConseiller({
    auth,
    params,
    inertia,
    response,
    session,
  }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    const employeeId = Number(params.id)
    const typeParam = String(params.type).toLowerCase()
    let employee: Employee
    try {
      employee = await Employee.query()
        .where('id', employeeId)
        .where('organizationId', auth.user.organizationId)
        .firstOrFail()
    } catch {
      session.flash('error', 'Candidat introuvable.')
      return response.redirect('/dashboard/conseiller/employees')
    }
    const latest = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', typeParam)
      .orderBy('date', 'desc')
      .orderBy('updatedAt', 'desc')
      .first()
    const exerciseTitle = EXERCISE_LIST.find((e) => e.slug === typeParam)?.title ?? typeParam
    const resultPayload = latest
      ? {
        id: latest.id,
        type: typeParam,
        date: latest.date ? latest.date.toISO()! : latest.updatedAt.toISO()!,
        duration: latest.duration ?? 0,
        data: latest.data ?? {},
        quantitativeScore: latest.quantitativeScore ?? 0,
        qualitativeAnalysis: latest.qualitativeAnalysis ?? undefined,
      }
      : null
    return (inertia as any).render('dashboard/ExerciseResultDetail', {
      employeeId: String(employee.id),
      employeeName: employee.name,
      result: resultPayload,
      exerciseType: typeParam,
      exerciseTitle,
    })
  }

  /**
   * Inertia page: exercise with initial draft/result for supported types.
   */
  public async showDashboard({ auth, params, inertia, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = Number(params.id)
    const typeParam = String(params.type).toLowerCase()

    let employee: Employee | null
    try {
      employee = await Employee.query()
        .where('id', employeeId)
        .where('organizationId', auth.user.organizationId)
        .preload('exerciseResults')
        .firstOrFail()
    } catch {
      session.flash('error', 'Candidat introuvable.')
      return response.redirect('/dashboard/conseiller/employees')
    }

    const employeeRecord = employee

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

    const initialDraftsByType: Record<string, any> = {}
    for (const exerciseType of draftTypes) {
      if (typeParam !== exerciseType) continue
      const draft = await ExerciseResult.query()
        .where('employeeId', employeeRecord.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'draft')
        .orderBy('updatedAt', 'desc')
        .first()
      initialDraftsByType[exerciseType] = draft
        ? {
          employeeId: employeeRecord.id,
          type: exerciseType,
          lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
          data: draft.data,
        }
        : null
      break
    }

    const pageName = EXERCISE_TYPE_TO_PAGE[typeParam] ?? 'dashboard/ConseillerExercise'
    const props =
      pageName === 'dashboard/ConseillerExercise'
        ? { type: params.type, employeeId: String(employeeRecord.id), initialDraftsByType }
        : { employeeId: String(employeeRecord.id), initialDraftsByType }
    return (inertia as any).render(pageName, props)
  }

  /**
   * Conseiller: Inertia page for exercise without employee context (same as candidat: use current user's employee).
   */
  public async showDashboardConseillerExerciseSelf({
    auth,
    params,
    inertia,
    response,
  }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }
    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const typeParam = String(params.type).toLowerCase()
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
    const initialDraftsByType: Record<string, any> = {}
    for (const exerciseType of draftTypes) {
      if (typeParam !== exerciseType) continue
      const draft = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'draft')
        .orderBy('updatedAt', 'desc')
        .first()
      initialDraftsByType[exerciseType] = draft
        ? {
          employeeId: employee.id,
          type: exerciseType,
          lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
          data: draft.data,
        }
        : null
      break
    }
    const pageName = EXERCISE_TYPE_TO_PAGE[typeParam] ?? 'dashboard/CandidatExercise'
    const props =
      pageName === 'dashboard/CandidatExercise'
        ? { type: params.type, initialDraftsByType }
        : { initialDraftsByType }
    return (inertia as any).render(pageName, props)
  }

  /**
   * Candidat: Inertia page for exercise (no employeeId; employee resolved from auth.user).
   */
  public async showDashboardCandidat({ auth, params, inertia, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const typeParam = String(params.type).toLowerCase()

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

    const initialDraftsByType: Record<string, any> = {}
    for (const exerciseType of draftTypes) {
      if (typeParam !== exerciseType) continue
      const draft = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'draft')
        .orderBy('updatedAt', 'desc')
        .first()
      initialDraftsByType[exerciseType] = draft
        ? {
          employeeId: employee.id,
          type: exerciseType,
          lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
          data: draft.data,
        }
        : null
      break
    }

    const pageName = EXERCISE_TYPE_TO_PAGE[typeParam] ?? 'dashboard/CandidatExercise'
    const props =
      pageName === 'dashboard/CandidatExercise'
        ? { type: params.type, initialDraftsByType }
        : { initialDraftsByType }
    return (inertia as any).render(pageName, props)
  }

  /**
   * Candidat: save draft for current user's employee.
   */
  public async saveDraftFromDashboardCandidat({ auth, request, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const payload = await request.validateUsing(saveExerciseDraftValidator)

    await this.service.saveDraft({
      employeeId: employee.id,
      type: payload.type,
      data: payload.data,
    })

    return response.redirect().back()
  }

  /**
   * Candidat: save exercise result for current user's employee.
   */
  public async storeFromDashboardCandidat({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const payload = await request.validateUsing(saveExerciseResultValidator)

    await this.service.saveResult({
      employeeId: employee.id,
      type: payload.type,
      status: payload.status,
      date: payload.date,
      duration: payload.duration,
      data: payload.data,
      quantitativeScore: payload.quantitativeScore,
      qualitativeAnalysis: payload.qualitativeAnalysis,
      plan: payload.plan,
    })

    const typeLabelMap: Record<string, string> = {
      [EXERCICE_RESULTS_TYPES.MOTIVATION]: 'Motivation',
      [EXERCICE_RESULTS_TYPES.VALUES]: 'Valeurs',
      [EXERCICE_RESULTS_TYPES.PERSONALITY]: 'Personnalité',
      [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: 'Courbe de vie',
      [EXERCICE_RESULTS_TYPES.TARGETING]: 'Ciblage',
      [EXERCICE_RESULTS_TYPES.DISC]: 'DISC',
      [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: 'Cartographie des compétences',
      [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: 'Cercle de contrôle',
    }

    const label = typeLabelMap[String(payload.type)] ?? 'Exercice'
    session.flash('success', `Exercice ${label} enregistré.`)
    return response.redirect('/dashboard/candidat')
  }
}
