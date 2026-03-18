import Employee from '#models/employee'
import Note from '#models/note'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import { USERS_ROLES } from '#shared/constants/user'
import { createNoteValidator } from '#validators/note/create_note_validator'
import { updateNoteValidator } from '#validators/note/update_note_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class NotesController {
  /**
   * List notes for an employee.
   * Advisors see all notes, employees only see shared notes.
   */
  public async index({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const employeeId = Number(params.id ?? params.employeeId)

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee not found' })
    }

    const isAdvisor = user.role === USERS_ROLES.ADVISOR || user.role === USERS_ROLES.ADMIN
    const isOwnProfile = employee.userId === user.id

    if (!isAdvisor && !isOwnProfile) {
      return response.forbidden({ message: 'Access denied' })
    }

    const query = Note.query()
      .where('employeeId', employeeId)
      .whereNull('deletedAt')
      .preload('author')
      .orderBy('createdAt', 'desc')

    if (!isAdvisor) {
      query.where('visibility', NOTE_VISIBILITY.SHARED)
    }

    const notes = await query

    return response.json(
      notes.map((note) => ({
        id: note.id,
        content: note.content,
        visibility: note.visibility,
        appointmentId: note.appointmentId,
        exerciseResultId: note.exerciseResultId,
        authorId: note.authorId,
        authorName: note.author?.name ?? 'Unknown',
        createdAt: note.createdAt.toISO(),
        updatedAt: note.updatedAt.toISO(),
        canEdit: note.authorId === user.id,
      }))
    )
  }

  /**
   * List shared notes for the current employee (candidat view).
   */
  public async indexForCandidat({ auth, response }: HttpContext) {
    const user = auth.user!

    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      return response.notFound({ message: 'Employee profile not found' })
    }

    const notes = await Note.query()
      .where('employeeId', employee.id)
      .where('visibility', NOTE_VISIBILITY.SHARED)
      .whereNull('deletedAt')
      .preload('author')
      .orderBy('createdAt', 'desc')

    return response.json(
      notes.map((note) => ({
        id: note.id,
        content: note.content,
        visibility: note.visibility,
        appointmentId: note.appointmentId,
        exerciseResultId: note.exerciseResultId,
        authorName: note.author?.name ?? 'Unknown',
        createdAt: note.createdAt.toISO(),
        updatedAt: note.updatedAt.toISO(),
        canEdit: false,
      }))
    )
  }

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

    if (payload.appointmentId) {
      const appointmentExists = await employee
        .related('appointments')
        .query()
        .where('id', payload.appointmentId)
        .first()
      if (!appointmentExists) {
        return response.badRequest({ message: 'Appointment not found' })
      }
    }

    if (payload.exerciseResultId) {
      const exerciseExists = await employee
        .related('exerciseResults')
        .query()
        .where('id', payload.exerciseResultId)
        .first()
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
      appointmentId: payload.appointmentId ?? null,
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
