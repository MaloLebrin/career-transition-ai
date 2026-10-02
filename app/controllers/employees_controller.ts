import EmployeeAlreadyExistsException from '#exceptions/employee_already_exists_exception'
import { mapEmployee, mapExerciseResult, mapSupportPlanStep } from '#mappers/employee_mapper'
import { redactEmployeePayload, redactExerciseResults } from '#mappers/results_access_mapper'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Note from '#models/note'
import Skill from '#models/skill'
import SupportPlanStep from '#models/support_plan_step'
import {
  CANDIDATE_DOCUMENTS_URL,
  CandidateDocumentsService,
  advisorDocumentsUrl,
} from '#services/candidate_documents_service'
import { buildDossierArchive, dossierZipFilename } from '#services/dossier_export_service'
import type { CandidateDataRights } from '#shared/types/candidate_data/requests'
import { EmployeesService } from '#services/employees_service'
import { ExerciseAccessService } from '#services/exercise_access_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createEmployeeValidator } from '#validators/employee/employee_create_validator'
import { updateEmployeeValidator } from '#validators/employee/employee_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EmployeesController {
  constructor(
    private employeesService: EmployeesService,
    private candidateDocuments: CandidateDocumentsService,
    private exerciseAccess: ExerciseAccessService
  ) {}

  /**
   * Inertia form: resend onboarding link for an existing employee.
   * POST /dashboard/conseiller/employees/:id/onboarding/resend
   */
  public async resendOnboardingLink({ params, auth, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const employee = await Employee.query()
      .where('id', Number(params.id))
      .where('organizationId', user.organizationId)
      .firstOrFail()

    try {
      await this.employeesService.resendOnboardingLink(employee)
    } catch (err: any) {
      session.flash('error', err?.message ?? "Impossible de renvoyer le lien d'onboarding.")
      return response.redirect().back()
    }

    session.flash('success', 'Lien d’onboarding renvoyé.')
    return response.redirect().back()
  }

  /**
   * Inertia form: create employee (and user + onboarding link) then redirect with flash.
   */
  public async storeFromDashboard({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const payload = await request.validateUsing(createEmployeeValidator)
    try {
      await this.employeesService.create(
        {
          organizationId: user.organizationId,
          advisorId: user.id,
          ...payload,
        },
        { sendInvite: true }
      )
    } catch (err) {
      if (err instanceof EmployeeAlreadyExistsException) {
        session.flash('error', err.message)
        return response.redirect().back()
      }
      throw err
    }

    session.flash('success', 'Candidat ajouté. Un lien d’activation a été envoyé par email.')
    return response.redirect('/dashboard/conseiller/employees')
  }

  /**
   * Inertia form: update employee then redirect with flash.
   */
  public async updateFromDashboard({ params, auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const payload = await request.validateUsing(updateEmployeeValidator)

    const employeeQuery = Employee.query()
      .where('id', Number(params.id))
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))

    const employee = await employeeQuery.firstOrFail()

    this.employeesService.applyUpdate(employee, payload)
    await employee.save()

    session.flash('success', 'Candidat mis à jour.')
    return response.redirect(`/dashboard/conseiller/employees/${params.id}`)
  }

  /**
   * Inertia page: list employees for dashboard (shared data).
   */
  public async indexDashboard(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const organizationId = user.organizationId
    const advisorId = user.role === USERS_ROLES.ADVISOR ? user.id : null

    const query = Employee.query()
      .where('organizationId', organizationId)
      .if(advisorId !== null, (q) => q.where('advisorId', advisorId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))

    const employees = await query
    const data = employees.map(mapEmployee)

    return (ctx.inertia as any).render('dashboard/conseiller/employees/List', { employees: data })
  }

  /**
   * Inertia page: employee profile (read-only view of identity, summary, experiences, educations, skills).
   */
  public async showProfileDashboard(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const employeeIdFromParam = ctx.params.id ? Number(ctx.params.id) : null

    const employeeQuery = Employee.query()
      .where('organizationId', user.organizationId)
      .if(employeeIdFromParam !== null, (q) => q.where('id', employeeIdFromParam!))
      .if(employeeIdFromParam === null, (q) => q.where('userId', user.id))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))

    const [employee, availableSkills] = await Promise.all([
      employeeQuery.firstOrFail(),
      Skill.query()
        .where((query) => {
          query.where('organizationId', user.organizationId).orWhereNull('organizationId')
        })
        .whereNull('deletedAt')
        .orderBy('name', 'asc'),
    ])
    const sharedNotes = await Note.query()
      .where('employeeId', employee.id)
      .where('visibility', 'shared')
      .whereNull('deletedAt')
      .preload('author')
      .orderBy('createdAt', 'desc')

    // #101 : sur son propre profil, un particulier non payé ne reçoit pas les
    // résultats réservés au forfait ; les conseillers voient tout.
    const data =
      employeeIdFromParam === null && user.role === USERS_ROLES.EMPLOYEE
        ? redactEmployeePayload(mapEmployee(employee), await this.exerciseAccess.resolve(employee))
        : mapEmployee(employee)
    const documents = await this.candidateDocuments.list(employee, user)

    return (ctx.inertia as any).render('dashboard/employee/profile/Home', {
      employeeId: employee.id,
      employee: data,
      documents,
      documentsBaseUrl:
        employeeIdFromParam === null ? CANDIDATE_DOCUMENTS_URL : advisorDocumentsUrl(employee.id),
      // Droits RGPD en libre-service (#70) : seulement sur son propre profil.
      dataRights:
        employeeIdFromParam === null
          ? ({
              erasureRequestedAt: employee.erasureRequestedAt?.toISO() ?? null,
            } satisfies CandidateDataRights)
          : null,
      notes: sharedNotes.map((note) => ({
        id: note.id,
        content: note.content,
        visibility: note.visibility,
        supportPlanStepId: note.supportPlanStepId,
        exerciseResultId: note.exerciseResultId,
        authorId: note.authorId,
        authorName: note.author?.name ?? 'Unknown',
        createdAt: note.createdAt.toISO(),
        updatedAt: note.updatedAt.toISO(),
        canEdit: false,
      })),
      availableSkills: availableSkills.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
      })),
    })
  }

  /**
   * Download dossier ZIP (profil + results) for the given employee.
   * Same access rules as showDashboard: org-scoped.
   */
  public async downloadDossier(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const employee = await Employee.query()
      .where('id', Number(ctx.params.id))
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .first()

    if (!employee) {
      return ctx.response.notFound()
    }

    const filename = dossierZipFilename(employee.name)
    ctx.response.header('Content-Type', 'application/zip')
    ctx.response.header('Content-Disposition', `attachment; filename="${filename}"`)
    const archive = await buildDossierArchive(employee)
    ctx.response.stream(archive)
  }

  /**
   * Inertia page: employee detail for dashboard.
   */
  public async showDashboard(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const employeeQuery = Employee.query()
      .where('id', Number(ctx.params.id))
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps', (q) => q.preload('exercises'))

    const employee = await employeeQuery.firstOrFail()
    const notes = await Note.query()
      .where('employeeId', employee.id)
      .whereNull('deletedAt')
      .preload('author')
      .orderBy('createdAt', 'desc')
    const data = mapEmployee(employee)

    return (ctx.inertia as any).render('dashboard/conseiller/employees/Detail', {
      employeeId: String(employee.id),
      employee: data,
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
        canEdit: note.authorId === user.id,
      })),
    })
  }

  /**
   * Inertia page: step detail for advisor dashboard (feuille de route).
   */
  public async showStepDetail(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const employeeId = Number(ctx.params.id)
    const stepId = Number(ctx.params.stepId)

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employeeId)
      .preload('exercises')
      .firstOrFail()

    const exerciseTypes = step.exercises.map((e) => e.exerciseType)
    const results: ReturnType<typeof mapExerciseResult>[] = []

    if (exerciseTypes.length > 0) {
      const exerciseResults = await ExerciseResult.query()
        .where('employeeId', employeeId)
        .whereIn('type', exerciseTypes)
        .orderBy('createdAt', 'desc')

      for (const exerciseResult of exerciseResults) {
        results.push(mapExerciseResult(exerciseResult))
      }
    }
    const exerciseResultId = results[0]?.id
    const notes = exerciseResultId
      ? await Note.query()
          .where('employeeId', employeeId)
          .where('exerciseResultId', exerciseResultId)
          .whereNull('deletedAt')
          .preload('author')
          .orderBy('createdAt', 'desc')
      : []

    return (ctx.inertia as any).render('dashboard/conseiller/employees/StepDetail', {
      employeeId: String(employee.id),
      employeeName: employee.name,
      step: mapSupportPlanStep(step),
      results,
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
        canEdit: note.authorId === user.id,
      })),
    })
  }

  /**
   * Inertia page: step detail for candidat dashboard (ma feuille de route).
   */
  public async showStepDetailCandidat(ctx: HttpContext) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized()
    }

    const stepId = Number(ctx.params.stepId)

    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .firstOrFail()

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employee.id)
      .preload('exercises')
      .firstOrFail()

    const exerciseTypes = step.exercises.map((e) => e.exerciseType)
    const results: ReturnType<typeof mapExerciseResult>[] = []

    if (exerciseTypes.length > 0) {
      const exerciseResults = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .whereIn('type', exerciseTypes)
        .orderBy('createdAt', 'desc')

      for (const exerciseResult of exerciseResults) {
        results.push(mapExerciseResult(exerciseResult))
      }
    }

    // #101 : un expert peut assigner une étape à un particulier ; ses résultats
    // restent verrouillés tant que le forfait n'est pas réglé.
    const access = await this.exerciseAccess.resolve(employee)

    return (ctx.inertia as any).render('dashboard/candidat/StepDetail', {
      step: mapSupportPlanStep(step),
      results: redactExerciseResults(results, access),
    })
  }
}
