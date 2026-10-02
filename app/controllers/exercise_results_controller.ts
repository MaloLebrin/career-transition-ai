import { redactEmployeePayload } from '#mappers/results_access_mapper'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Note from '#models/note'
import { EmployeesService } from '#services/employees_service'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { ExerciseResultsService } from '#services/exercise_results_service'
import { EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultTypesValues,
  type ExerciceResultType,
} from '#shared/constants/exercises'
import { isB2cAccount, orderExercisesForB2c } from '#shared/helpers/b2c_access'
import { canAccessExercise } from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import EmployeeTransformer, { employeeToObject } from '#transformers/employee_transformer'
import { saveExerciseDraftValidator } from '#validators/exercise/exercise_draft_validator'
import { saveExerciseResultValidator } from '#validators/exercise/exercise_result_save_validator'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import type User from '#models/user'
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

/** Messages affichés quand l'exercice demandé n'est pas accessible (#100). */
export const EXERCISE_LOCKED_MESSAGES = {
  [EXERCISE_LOCK_REASONS.PLAN]:
    'Cette étape est verrouillée. Contactez votre conseiller pour la débloquer.',
  [EXERCISE_LOCK_REASONS.PAYMENT]:
    'Cet exercice fait partie du forfait. Débloquez vos résultats pour y accéder.',
} as const

function isExerciseType(value: string): value is ExerciceResultType {
  return (exerciceResultTypesValues as string[]).includes(value)
}

/** Types dont l'outil reprend un brouillon ou un résultat (ceux qui ont une page dédiée). */
function isDraftableType(value: string): value is ExerciceResultType {
  return isExerciseType(value) && value in EXERCISE_TYPE_TO_PAGE
}

/** Flash court après un POST refusé : l'étape (B2B) ou le forfait (B2C). */
function lockedFlashMessage(access: ExerciseAccess): string {
  return access.lockedReason === EXERCISE_LOCK_REASONS.PAYMENT
    ? 'Cet exercice fait partie du forfait.'
    : 'Cette étape est verrouillée.'
}

@inject()
export default class ExerciseResultsController {
  constructor(
    private service: ExerciseResultsService,
    private employeesService: EmployeesService,
    private access: ExerciseAccessService
  ) {}

  /**
   * L'id du candidat vient de l'URL : il doit appartenir à l'organisation du
   * conseiller connecté, sinon 404. Sans ce filtre, un conseiller de n'importe
   * quelle organisation écrivait des résultats (et déclenchait l'analyse IA et
   * les notifications) sur le candidat d'une autre.
   */
  private async employeeIdInOrganization(user: User, id: string) {
    const employee = await Employee.query()
      .select('id')
      .where('id', Number(id))
      .where(teamEmployeeScope(user))
      .firstOrFail()
    return employee.id
  }

  /**
   * Inertia form: save draft then redirect back.
   */
  public async saveDraftFromDashboard({ auth, params, request, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized()
    }

    const employeeId = await this.employeeIdInOrganization(auth.user, params.id)
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

    const employeeId = await this.employeeIdInOrganization(auth.user, params.id)
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
    const access = await this.access.resolve(employee)

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

    // B2C (#100) : exercices gratuits d'abord, le reste du catalogue ensuite.
    const exercises = isB2cAccount(access.accountType)
      ? orderExercisesForB2c(EXERCISE_LIST, access.freeExerciseTypes)
      : EXERCISE_LIST

    return (inertia as any).render('dashboard/employee/exercises/List', {
      exercises,
      unlockedExerciseSlugs: access.unlockedExerciseSlugs,
      completedExerciseSlugs,
      lockedReason: access.lockedReason,
      accountType: access.accountType,
      exerciseAccess: access,
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
        .where(teamEmployeeScope(auth.user))
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
        .where(teamEmployeeScope(auth.user))
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
        .where(teamEmployeeScope(auth.user))
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

    const initialDraftsByType: Record<string, any> = {}
    if (isDraftableType(typeParam)) {
      initialDraftsByType[typeParam] = await this.service.findLatestDraft(
        employeeRecord.id,
        typeParam
      )
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
    const typeParam = String(params.type).toLowerCase()
    const employee = await this.employeesService.findEmployeeForUser(auth.user)
    if (!employee) {
      // Conseiller sans fiche candidat (cas normal) : l'exercice s'affiche en
      // découverte, sans brouillon à reprendre ni employé à qui l'enregistrer.
      const exercisePage = EXERCISE_TYPE_TO_PAGE[typeParam]
      if (!exercisePage) {
        return response.notFound()
      }
      return (inertia as any).render(exercisePage, { initialDraftsByType: {} })
    }
    const initialDraftsByType: Record<string, any> = {}
    if (isDraftableType(typeParam)) {
      initialDraftsByType[typeParam] = await this.service.findLatestDraft(employee.id, typeParam)
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
    const access = await this.access.resolve(employee)

    if (!isExerciseType(typeParam) || !canAccessExercise(access, typeParam)) {
      const blockedMessage = EXERCISE_LOCKED_MESSAGES[access.lockedReason]
      session.flash('error', blockedMessage)
      return (inertia as any).render('dashboard/employee/exercises/Home', {
        type: params.type,
        employee: redactEmployeePayload(employeeToObject(employee), access),
        initialDraftsByType: {},
        accessGranted: false,
        blockedMessage,
        lockedReason: access.lockedReason,
        exerciseAccess: access,
      })
    }

    const initialDraftsByType: Record<string, any> = {}
    let exerciseProgressPercent = 0
    if (isDraftableType(typeParam)) {
      const state = await this.service.findDraftOrCompletedForCandidate(employee.id, typeParam)
      initialDraftsByType[typeParam] = state.initialDraft
      exerciseProgressPercent = state.exerciseProgressPercent
    }

    return (inertia as any).render('dashboard/employee/exercises/Home', {
      type: params.type,
      // #101 : les autres résultats du candidat suivent la même règle de verrouillage.
      employee: redactEmployeePayload(employeeToObject(employee), access),
      initialDraftsByType,
      accessGranted: true,
      exerciseProgressPercent,
      exerciseAccess: access,
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
    const access = await this.access.resolve(employee)

    if (!canAccessExercise(access, payload.type)) {
      session.flash('error', lockedFlashMessage(access))
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
    const access = await this.access.resolve(employee)

    if (!canAccessExercise(access, payload.type)) {
      session.flash('error', lockedFlashMessage(access))
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
