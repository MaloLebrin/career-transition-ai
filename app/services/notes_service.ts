import {
  NoteForbiddenError,
  NoteLinkedResourceNotFoundError,
  NoteNotFoundError,
} from '#exceptions/note_errors'
import Employee from '#models/employee'
import Note from '#models/note'
import type User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { CreateNoteInput, UpdateNoteInput } from '#shared/types/note/inputs'
import { DateTime } from 'luxon'

/**
 * Notes de suivi posées par les conseillers sur un candidat.
 *
 * Toutes les lectures sont bornées à l'organisation de l'utilisateur : une
 * ressource d'une autre organisation lève `NoteNotFoundError` (404), jamais un
 * 403 qui en confirmerait l'existence.
 */
export class NotesService {
  /**
   * Candidat sur lequel `user` peut écrire une note.
   *
   * Seuls les conseillers et les admins d'organisation rédigent des notes : le
   * middleware `advisorOrAdmin()` laisse aussi passer le super admin, d'où ce
   * contrôle métier.
   */
  public async getEmployeeForNewNote(user: User, employeeId: number): Promise<Employee> {
    if (user.role !== USERS_ROLES.ADVISOR && user.role !== USERS_ROLES.ADMIN) {
      throw new NoteForbiddenError('Only advisors can create notes')
    }

    const employee = await Employee.query()
      .where('id', employeeId)
      .where('organizationId', user.organizationId)
      .first()

    if (!employee) {
      throw new NoteNotFoundError('Employee not found')
    }

    return employee
  }

  /**
   * Crée la note. L'étape et le résultat d'exercice éventuellement liés doivent
   * appartenir au candidat.
   */
  public async create(user: User, employee: Employee, input: CreateNoteInput): Promise<Note> {
    if (input.supportPlanStepId) {
      const step = await employee
        .related('supportPlanSteps')
        .query()
        .where('id', input.supportPlanStepId)
        .first()
      if (!step) {
        throw new NoteLinkedResourceNotFoundError('Support plan step not found')
      }
    }

    if (input.exerciseResultId) {
      const result = await employee
        .related('exerciseResults')
        .query()
        .where('id', input.exerciseResultId)
        .first()
      if (!result) {
        throw new NoteLinkedResourceNotFoundError('Exercise result not found')
      }
    }

    return Note.create({
      organizationId: user.organizationId,
      employeeId: employee.id,
      authorId: user.id,
      content: input.content,
      visibility: input.visibility,
      supportPlanStepId: input.supportPlanStepId ?? null,
      exerciseResultId: input.exerciseResultId ?? null,
    })
  }

  /**
   * Note non supprimée de l'organisation de `user`, dont il est l'auteur.
   */
  public async getEditableNote(user: User, noteId: number): Promise<Note> {
    const note = await Note.query()
      .where('id', noteId)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()

    if (!note) {
      throw new NoteNotFoundError()
    }

    if (note.authorId !== user.id) {
      throw new NoteForbiddenError('Only the author can edit this note')
    }

    return note
  }

  /** Modification partielle : les champs absents sont conservés. */
  public async update(note: Note, input: UpdateNoteInput): Promise<Note> {
    if (input.content !== undefined) {
      note.content = input.content
    }
    if (input.visibility !== undefined) {
      note.visibility = input.visibility
    }
    return note.save()
  }

  /** Suppression douce : la ligne reste, `deletedAt` la masque. */
  public async softDelete(note: Note): Promise<void> {
    note.deletedAt = DateTime.now()
    await note.save()
  }
}
