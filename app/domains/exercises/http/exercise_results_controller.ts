import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Note from '#models/note'
import { EmployeesService } from '#domains/employees/services/employees_service'
import { ExerciseResultsService } from '#domains/exercises/services/exercise_results_service'
import { EXERCICE_RESULTS_TYPES, EXERCISE_LIST } from '#shared/constants/exercises'
import { getExerciseProgress } from '#shared/helpers/exercise_progress'
import EmployeeTransformer from '#transformers/employee_transformer'
import { saveExerciseDraftValidator } from '#validators/exercise/exercise_draft_validator'
import { saveExerciseResultValidator } from '#validators/exercise/exercise_result_save_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Map exercise type (slug) to dedicated Inertia page. Unknown type falls back to dashboard/Exercise. */
const EXERCISE_TYPE_TO_PAGE: Record<string, string> = {
  [EXERCICE_RESULTS_TYPES.MOTIVATION]: 'dashboard/shared/exercises/Motivation',
  [EXERCICE_RESULTS_TYPES.VALUES]: 'dashboard/shared/exercises/Values',
  [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: 'dashboard/shared/exercises/LifeCurve',
  [EXERCICE_RESULTS_TYPES.PERSONALITY]: 'dashboard/shared/exercises/Personality',
  [EXERCICE_RESULTS_TYPES.TARGETING]: 'dashboard/shared/exercises/Targeting',
  [EXERCICE_RESULTS_TYPES.DISC]: 'dashboard/shared/exercises/DISC',
  [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: 'dashboard/shared/exercises/SkillMapping',
  [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: 'dashboard/shared/exercises/CircleOfControl',
}

@inject()
export default class ExerciseResultsController {
  constructor(
    private service: ExerciseResultsService,
    private employeesService: EmployeesService
  ) {}

  /**
   * Inertia form: save draft then redirect back.
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

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const unlockedExerciseSlugs = await this.service.getUnlockedExerciseSlugsForEmployee(employee.id)

    const latestStatusByType = new Map<string, { status: string; date: string }>()
    for (const r of employee.exerciseResults || []) {
      const type = String(r.type)
      const date = r.date ? r.date.toISO()! : (r.updatedAt?.toISO() ?? '')
      const current = latestStatusByType.get(type)

      if (!current || date > current.date) {
        latestStatusByType.set(type, { status: String(r.status), date })
      }
    }

    const completedExerciseSlugs: string[] = []
    for (const [type, latest] of latestStatusByType.entries()) {
      if (latest.status === 'completed') {
        completedExerciseSlugs.push(type)
      }
    }

    return (inertia as any).render('dashboard/employee/exercises/List', {
      exercises: EXERCISE_LIST,
      unlockedExerciseSlugs,
      completedExerciseSlugs,
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
    return (inertia as any).render('dashboard/conseiller/exercises/List', {
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
    const notes = latest
      ? await Note.query()
          .where('employeeId', employee.id)
          .where('exerciseResultId', latest.id)
          .whereNull('deletedAt')
          .preload('author')
          .orderBy('createdAt', 'desc')
      : []
    return (inertia as any).render('dashboard/conseiller/exercises/ResultDetail', {
      employeeId: String(employee.id),
      employeeName: employee.name,
      result: resultPayload,
      exerciseType: typeParam,
      exerciseTitle,
      notes: notes.map((note) => ({
        id: note.id,
        content: note.content,
        visibility: note.visibility,
        supportPlanStepId: note.supportPlanStepId,
        exerciseResultId: note.exerciseResultId,
        authorId: note.authorId,
        authorName: note.author?.name ?? 'Unknown',
        createdAt: note.createdAt.toISO(),
        updatedAt: note.updatedAt.toISO(),
        canEdit: note.authorId === auth.user!.id,
      })),
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
        .preload('skills', (q) => q.pivotColumns(['level']))
        .preload('exerciseResults')
        .preload('supportPlanSteps', (q) => q.preload('exercises'))
        .preload('experiences')
        .preload('educations')
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

    const pageName = EXERCISE_TYPE_TO_PAGE[typeParam] ?? 'dashboard/conseiller/exercises/Home'
    const employeePayload = EmployeeTransformer.transform(employeeRecord)
    const props =
      pageName === 'dashboard/conseiller/exercises/Home'
        ? {
            type: params.type,
            employeeId: String(employeeRecord.id),
            employee: employeePayload,
            initialDraftsByType,
          }
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
    const pageName = EXERCISE_TYPE_TO_PAGE[typeParam] ?? 'dashboard/employee/exercises/Home'
    const employeePayload = EmployeeTransformer.transform(employee)
    const props =
      pageName === 'dashboard/employee/exercises/Home'
        ? { type: params.type, employee: employeePayload, initialDraftsByType }
        : { initialDraftsByType }
    return (inertia as any).render(pageName, props)
  }

  /**
   * Candidat: Inertia page for exercise (no employeeId; employee resolved from auth.user).
   */
  public async showDashboardCandidat({ auth, params, inertia, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const typeParam = String(params.type).toLowerCase()

    const accessGranted = await this.service.canAccessExerciseForEmployee(employee.id, typeParam as any)

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
    let exerciseProgressPercent = 0

    if (!accessGranted) {
      session.flash(
        'error',
        'Cette étape est verrouillée. Contactez votre conseiller pour la débloquer.'
      )
      return (inertia as any).render('dashboard/employee/exercises/Home', {
        type: params.type,
        employee: EmployeeTransformer.transform(employee),
        initialDraftsByType: {},
        accessGranted: false,
        blockedMessage: 'Cette étape est verrouillée. Contactez votre conseiller pour la débloquer.',
      })
    }

    for (const exerciseType of draftTypes) {
      if (typeParam !== exerciseType) continue

      const draft = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'draft')
        .orderBy('updatedAt', 'desc')
        .first()

      // If there's no draft but there is a completed result, prefill the exercise.
      const completed = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .andWhere('type', exerciseType)
        .andWhere('status', 'completed')
        .orderBy('date', 'desc')
        .orderBy('updatedAt', 'desc')
        .first()

      if (draft) {
        initialDraftsByType[exerciseType] = {
          employeeId: employee.id,
          type: exerciseType,
          lastUpdated: draft.updatedAt.toISO() || new Date().toISOString(),
          data: draft.data,
        }
        exerciseProgressPercent = getExerciseProgress(exerciseType, draft.data ?? {}, draft.status)
      } else if (completed) {
        initialDraftsByType[exerciseType] = {
          employeeId: employee.id,
          type: exerciseType,
          lastUpdated: completed.updatedAt.toISO() || new Date().toISOString(),
          // The tools expect `step` inside their draft data.
          // When a result is completed, we want to land on step 2.
          data: { ...(completed.data ?? {}), step: 2 },
        }
        exerciseProgressPercent = getExerciseProgress(exerciseType, completed.data ?? {}, completed.status)
      } else {
        initialDraftsByType[exerciseType] = null
        exerciseProgressPercent = 0
      }

      break
    }

    return (inertia as any).render('dashboard/employee/exercises/Home', {
      type: params.type,
      employee: EmployeeTransformer.transform(employee),
      initialDraftsByType,
      accessGranted: true,
      exerciseProgressPercent,
    })
  }

  /**
   * Candidat: save draft for current user's employee.
   */
  public async saveDraftFromDashboardCandidat({ auth, request, response, session }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employee = await this.employeesService.getEmployeeForUser(auth.user)
    const payload = await request.validateUsing(saveExerciseDraftValidator)
    const accessGranted = await this.service.canAccessExerciseForEmployee(employee.id, payload.type as any)

    if (!accessGranted) {
      session.flash('error', 'Cette étape est verrouillée.')
      return response.redirect().toPath(`/dashboard/candidat/exercises/${payload.type}`)
    }

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
    const accessGranted = await this.service.canAccessExerciseForEmployee(employee.id, payload.type as any)

    if (!accessGranted) {
      session.flash('error', 'Cette étape est verrouillée.')
      return response.redirect().toPath(`/dashboard/candidat/exercises/${payload.type}`)
    }

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

