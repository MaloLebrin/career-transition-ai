import {
  NoteForbiddenError,
  NoteLinkedResourceNotFoundError,
  NoteNotFoundError,
} from '#exceptions/note_errors'
import Employee from '#models/employee'
import Note from '#models/note'
import type User from '#models/user'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { CreateNoteInput, UpdateNoteInput } from '#shared/types/note/inputs'
import { DateTime } from 'luxon'

/**
 * Notes de suivi posées par les conseillers sur un candidat.
 *
 * Toutes les lectures sont bornées à l'organisation de l'utilisateur, et la
 * fiche cible à son périmètre d'équipe (`teamEmployeeScope`, #167) : une
 * ressource hors de portée lève `NoteNotFoundError` (404), jamais un 403 qui en
 * confirmerait l'existence.
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
      .where(teamEmployeeScope(user))
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
   * Note non supprimée dont `user` est l'auteur, sur une fiche de son
   * périmètre d'équipe (`teamEmployeeScope`, #167). Toute autre note — d'un
   * collègue, d'une autre organisation, ou d'un particulier réassigné à un
   * autre expert — est introuvable (404), sans confirmer qu'elle existe.
   */
  public async getEditableNote(user: User, noteId: number): Promise<Note> {
    const note = await Note.query()
      .where('id', noteId)
      .where('organizationId', user.organizationId)
      .where('authorId', user.id)
      .whereIn('employeeId', Employee.query().select('id').where(teamEmployeeScope(user)))
      .whereNull('deletedAt')
      .first()

    if (!note) {
      throw new NoteNotFoundError()
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
