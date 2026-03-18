import Employee from '#models/employee'
import SupportPlanStep from '#models/support_plan_step'
import { USERS_ROLES } from '#shared/constants/user'
import { createStepValidator } from '#validators/support_plan_step/create_step_validator'
import { updateStepValidator } from '#validators/support_plan_step/update_step_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SupportPlanStepsController {
  /**
   * List steps for an employee.
   */
  public async index({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const steps = await SupportPlanStep.query()
      .where('employeeId', employeeId)
      .orderBy('sortOrder', 'asc')

    return response.json(
      steps.map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        dueDate: step.dueDate?.toISODate(),
        completed: step.completed,
        notes: step.notes,
        associatedExercise: step.associatedExercise,
        sortOrder: step.sortOrder,
        isLocked: step.isLocked,
      }))
    )
  }

  /**
   * Create a new step (advisor only).
   */
  public async store({ auth, params, request, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can create steps' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const payload = await request.validateUsing(createStepValidator)

    const maxSortOrder = await SupportPlanStep.query()
      .where('employeeId', employeeId)
      .max('sort_order as max')
      .first()

    const nextSortOrder = payload.sortOrder ?? ((maxSortOrder?.$extras?.max ?? 0) + 1)

    await SupportPlanStep.create({
      employeeId,
      title: payload.title,
      description: payload.description ?? null,
      dueDate: DateTime.fromISO(payload.dueDate),
      associatedExercise: payload.associatedExercise ?? null,
      sortOrder: nextSortOrder,
      isLocked: payload.isLocked ?? true,
      completed: false,
    })

    session.flash('success', 'Étape créée')
    return response.redirect().back()
  }

  /**
   * Update a step (advisor only).
   */
  public async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)
    const stepId = Number(params.stepId)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can update steps' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employeeId)
      .first()

    if (!step) {
      return response.notFound({ message: 'Step not found' })
    }

    const payload = await request.validateUsing(updateStepValidator)

    if (payload.title !== undefined) step.title = payload.title
    if (payload.description !== undefined) step.description = payload.description ?? null
    if (payload.dueDate !== undefined) step.dueDate = DateTime.fromISO(payload.dueDate)
    if (payload.associatedExercise !== undefined) step.associatedExercise = payload.associatedExercise ?? null
    if (payload.sortOrder !== undefined) step.sortOrder = payload.sortOrder
    if (payload.isLocked !== undefined) step.isLocked = payload.isLocked
    if (payload.completed !== undefined) step.completed = payload.completed
    if (payload.notes !== undefined) step.notes = payload.notes ?? null

    await step.save()

    session.flash('success', 'Étape mise à jour')
    return response.redirect().back()
  }

  /**
   * Delete a step (advisor only).
   */
  public async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)
    const stepId = Number(params.stepId)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can delete steps' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employeeId)
      .first()

    if (!step) {
      return response.notFound({ message: 'Step not found' })
    }

    await step.delete()

    session.flash('success', 'Étape supprimée')
    return response.redirect().back()
  }

  /**
   * Unlock a step (set isLocked to false).
   */
  public async unlock({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)
    const stepId = Number(params.stepId)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can unlock steps' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employeeId)
      .first()

    if (!step) {
      return response.notFound({ message: 'Step not found' })
    }

    step.isLocked = false
    await step.save()

    session.flash('success', 'Étape déverrouillée')
    return response.redirect().back()
  }

  /**
   * Lock a step (set isLocked to true).
   */
  public async lock({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id)
    const stepId = Number(params.stepId)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can lock steps' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const step = await SupportPlanStep.query()
      .where('id', stepId)
      .where('employeeId', employeeId)
      .first()

    if (!step) {
      return response.notFound({ message: 'Step not found' })
    }

    step.isLocked = true
    await step.save()

    session.flash('success', 'Étape verrouillée')
    return response.redirect().back()
  }
}
