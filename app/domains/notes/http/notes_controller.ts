import Employee from '#models/employee'
import Note from '#models/note'
import { USERS_ROLES } from '#shared/constants/user'
import { createNoteValidator } from '#validators/note/create_note_validator'
import { updateNoteValidator } from '#validators/note/update_note_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class NotesController {
  /**
   * Create a new note (advisor only).
   */
  public async store({ auth, params, request, response, session }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id ?? params.employeeId)

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    if (!isAdvisor) {
      return response.forbidden({ message: 'Only advisors can create notes' })
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const payload = await request.validateUsing(createNoteValidator)

    if (payload.supportPlanStepId) {
      const stepExists = await employee.related('supportPlanSteps').query().where('id', payload.supportPlanStepId).first()
      if (!stepExists) {
        return response.badRequest({ message: 'Support plan step not found' })
      }
    }

    if (payload.exerciseResultId) {
      const exerciseExists = await employee.related('exerciseResults').query().where('id', payload.exerciseResultId).first()
      if (!exerciseExists) {
        return response.badRequest({ message: 'Exercise result not found' })
      }
    }

    await Note.create({
      organizationId: user.organizationId,
      employeeId: employee.id,
      authorId: user.id,
      content: payload.content,
      visibility: payload.visibility,
      supportPlanStepId: payload.supportPlanStepId ?? null,
      exerciseResultId: payload.exerciseResultId ?? null,
    })

    session.flash('success', 'Note ajoutée')
    return response.redirect().back()
  }

  /**
   * Update a note (author only).
   */
  public async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.user!
    const noteId = Number(params.id)

    const note = await Note.query()
      .where('id', noteId)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()

    if (!note) {
      return response.notFound({ message: 'Note not found' })
    }

    if (note.authorId !== user.id) {
      return response.forbidden({ message: 'Only the author can edit this note' })
    }

    const payload = await request.validateUsing(updateNoteValidator)

    if (payload.content !== undefined) {
      note.content = payload.content
    }
    if (payload.visibility !== undefined) {
      note.visibility = payload.visibility
    }

    await note.save()

    session.flash('success', 'Note mise à jour')
    return response.redirect().back()
  }

  /**
   * Delete a note (soft delete, author only).
   */
  public async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const noteId = Number(params.id)

    const note = await Note.query()
      .where('id', noteId)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()

    if (!note) {
      return response.notFound({ message: 'Note not found' })
    }

    if (note.authorId !== user.id) {
      return response.forbidden({ message: 'Only the author can delete this note' })
    }

    note.deletedAt = DateTime.now()
    await note.save()

    session.flash('success', 'Note supprimée')
    return response.redirect().back()
  }
}

