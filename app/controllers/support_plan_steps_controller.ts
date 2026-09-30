import Employee from '#models/employee'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createStepValidator } from '#validators/support_plan_step/create_step_validator'
import { updateStepValidator } from '#validators/support_plan_step/update_step_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

@inject()
export default class SupportPlanStepsController {
  constructor(private candidateNotifications: CandidateNotificationsService) {}

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

    const nextSortOrder = payload.sortOrder ?? (maxSortOrder?.$extras?.max ?? -1) + 1

    const step = await SupportPlanStep.create({
      employeeId,
      advisorId: user.id,
      title: payload.title ?? null,
      description: payload.description ?? null,
      instructions: payload.instructions ?? null,
      dueDate: payload.dueDate ? DateTime.fromISO(payload.dueDate) : null,
      scheduledAt: payload.scheduledAt ? DateTime.fromISO(payload.scheduledAt) : null,
      status: payload.status ?? APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: payload.locationOrLink ?? null,
      sortOrder: nextSortOrder,
      isLocked: payload.isLocked ?? true,
      completed: false,
    })

    if (payload.associatedExercises && payload.associatedExercises.length > 0) {
      await SupportPlanStepExercise.createMany(
        payload.associatedExercises.map((exerciseType, index) => ({
          supportPlanStepId: step.id,
          exerciseType,
          sortOrder: index,
        }))
      )
    }

    if (!step.isLocked) await this.candidateNotifications.stepUnlocked(employee, step)
    if (step.scheduledAt) await this.candidateNotifications.appointmentScheduled(employee, step)

    session.flash('success', 'RDV créé')
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
    const wasLocked = step.isLocked
    const previousScheduledAt = step.scheduledAt?.toMillis() ?? null

    if (payload.title !== undefined) step.title = payload.title ?? null
    if (payload.description !== undefined) step.description = payload.description ?? null
    if (payload.instructions !== undefined) step.instructions = payload.instructions ?? null
    if (payload.dueDate !== undefined)
      step.dueDate = payload.dueDate ? DateTime.fromISO(payload.dueDate) : null
    if (payload.scheduledAt !== undefined)
      step.scheduledAt = payload.scheduledAt ? DateTime.fromISO(payload.scheduledAt) : null
    if (payload.endedAt !== undefined)
      step.endedAt = payload.endedAt ? DateTime.fromISO(payload.endedAt) : null
    if (payload.status !== undefined) step.status = payload.status
    if (payload.locationOrLink !== undefined) step.locationOrLink = payload.locationOrLink ?? null
    if (payload.sortOrder !== undefined) step.sortOrder = payload.sortOrder
    if (payload.isLocked !== undefined) step.isLocked = payload.isLocked
    if (payload.completed !== undefined) step.completed = payload.completed
    if (payload.notes !== undefined) step.notes = payload.notes ?? null

    await step.save()

    if (payload.associatedExercises !== undefined) {
      await SupportPlanStepExercise.query().where('supportPlanStepId', step.id).delete()

      if (payload.associatedExercises.length > 0) {
        await SupportPlanStepExercise.createMany(
          payload.associatedExercises.map((exerciseType, index) => ({
            supportPlanStepId: step.id,
            exerciseType,
            sortOrder: index,
          }))
        )
      }
    }

    if (wasLocked && !step.isLocked) {
      await this.candidateNotifications.stepUnlocked(employee, step)
    }
    if (step.scheduledAt && step.scheduledAt.toMillis() !== previousScheduledAt) {
      await this.candidateNotifications.appointmentScheduled(employee, step)
    }

    session.flash('success', 'RDV mis à jour')
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

    session.flash('success', 'RDV supprimé')
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

    const wasLocked = step.isLocked
    step.isLocked = false
    await step.save()
    if (wasLocked) await this.candidateNotifications.stepUnlocked(employee, step)

    session.flash('success', 'RDV déverrouillé')
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

    session.flash('success', 'RDV verrouillé')
    return response.redirect().back()
  }
}
