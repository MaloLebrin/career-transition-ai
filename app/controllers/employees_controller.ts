import { mapEmployee, mapSupportPlanStep, mapExerciseResult } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import SupportPlanStep from '#models/support_plan_step'
import ExerciseResult from '#models/exercise_result'
import Skill from '#models/skill'
import { buildDossierArchive, dossierZipFilename } from '#services/dossier_export_service'
import { EmployeesService } from '#services/employees_service'
import { USERS_ROLES } from '#shared/constants/user'
import { createEmployeeValidator } from '#validators/employee/employee_create_validator'
import { updateEmployeeValidator } from '#validators/employee/employee_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EmployeesController {
  constructor(private employeesService: EmployeesService) { }

  /**
   * JSON API: list employees visible to current user.
   */
  public async index({ auth, response }: HttpContext) {
    const user = auth.user
    const organizationId = user?.organizationId ?? null
    // Admin sees all org employees; advisor sees only their advised employees
    const advisorId = user?.role === USERS_ROLES.ADVISOR ? user.id : null

    const query = Employee.query()
      .if(organizationId !== null, (q) => q.where('organizationId', organizationId!))
      .if(advisorId !== null, (q) => q.where('advisorId', advisorId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employees = await query

    const data = employees.map(mapEmployee)

    return response.json(data)
  }

  /**
   * JSON API: show single employee.
   * When the current user is an employee and the requested id is their user id,
   * returns the employee record linked to that user (by userId), not by employee id.
   */
  public async show({ params, auth, response }: HttpContext) {
    const user = auth.user
    const organizationId = user?.organizationId ?? null
    const requestedId = Number(params.id)

    const isSelfRequest = user?.role === USERS_ROLES.EMPLOYEE && user.id === requestedId

    const employeeQuery = Employee.query()
      .if(
        isSelfRequest,
        (q) => q.where('userId', requestedId),
        (q) => q.where('id', requestedId)
      )
      .if(organizationId !== null, (q) => q.where('organizationId', organizationId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employee = await employeeQuery.firstOrFail()

    const data = mapEmployee(employee) // TODO: remove this mapper

    return response.json(data)
  }

  public async store({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(createEmployeeValidator)

    const dto = await this.employeesService.create({
      organizationId: user.organizationId,
      advisorId: user.id,
      ...payload,
    })

    return response.json(dto)
  }

  public async update({ params, request, auth, response }: HttpContext) {
    const organizationId = auth.user?.organizationId ?? null

    const payload = await request.validateUsing(updateEmployeeValidator)

    const employeeQuery = Employee.query()
      .where('id', Number(params.id))
      .if(organizationId !== null, (q) => q.where('organizationId', organizationId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employee = await employeeQuery.firstOrFail()

    this.employeesService.applyUpdate(employee, payload)
    await employee.save()

    const data = mapEmployee(employee)

    return response.json(data)
  }

  /**
   * Inertia form: create employee (and user + onboarding link) then redirect with flash.
   */
  public async storeFromDashboard({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const payload = await request.validateUsing(createEmployeeValidator)
    const baseUrl = `${request.protocol()}://${request.hostname()}`

    try {
      await this.employeesService.create(
        {
          organizationId: user.organizationId,
          advisorId: user.id,
          ...payload,
        },
        { baseUrl }
      )
    } catch (err: any) {
      if (err.message?.includes('existe déjà')) {
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
      .preload('supportPlanSteps')
      .preload('appointments')

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
      .preload('supportPlanSteps')
      .preload('appointments')

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

    const employeeQuery = Employee.query()
      .where('user_id', user.id)
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const [employee, availableSkills] = await Promise.all([
      employeeQuery.firstOrFail(),
      Skill.query()
        .where((query) => {
          query.where('organizationId', user.organizationId).orWhereNull('organizationId')
        })
        .whereNull('deletedAt')
        .orderBy('name', 'asc'),
    ])

    const data = mapEmployee(employee)

    return (ctx.inertia as any).render('dashboard/employee/profile/Home', {
      employeeId: employee.id,
      employee: data,
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
      .preload('supportPlanSteps')
      .preload('appointments')

    const employee = await employeeQuery.firstOrFail()
    const data = mapEmployee(employee)

    return (ctx.inertia as any).render('dashboard/conseiller/employees/Detail', {
      employeeId: String(employee.id),
      employee: data,
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
      .firstOrFail()

    let result = null
    if (step.associatedExercise) {
      const exerciseResult = await ExerciseResult.query()
        .where('employeeId', employeeId)
        .where('type', step.associatedExercise)
        .orderBy('createdAt', 'desc')
        .first()

      if (exerciseResult) {
        result = mapExerciseResult(exerciseResult)
      }
    }

    return (ctx.inertia as any).render('dashboard/conseiller/employees/StepDetail', {
      employeeId: String(employee.id),
      employeeName: employee.name,
      step: mapSupportPlanStep(step),
      result,
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
      .firstOrFail()

    let result = null
    if (step.associatedExercise) {
      const exerciseResult = await ExerciseResult.query()
        .where('employeeId', employee.id)
        .where('type', step.associatedExercise)
        .orderBy('createdAt', 'desc')
        .first()

      if (exerciseResult) {
        result = mapExerciseResult(exerciseResult)
      }
    }

    return (ctx.inertia as any).render('dashboard/candidat/StepDetail', {
      step: mapSupportPlanStep(step),
      result,
    })
  }
}
