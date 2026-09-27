import { NotesService } from '#services/notes_service'
import { createNoteValidator } from '#validators/note/create_note_validator'
import { updateNoteValidator } from '#validators/note/update_note_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Notes conseiller. Logique et contrôles d'accès dans `NotesService` ; les
 * erreurs métier (`#exceptions/note_errors`) sont rendues par `handler.ts`.
 */
@inject()
export default class NotesController {
  constructor(private notesService: NotesService) {}

  /**
   * Create a new note (advisor or organization admin).
   */
  public async store({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const employee = await this.notesService.getEmployeeForNewNote(
      user,
      Number(params.id ?? params.employeeId)
    )
    const payload = await request.validateUsing(createNoteValidator)

    await this.notesService.create(user, employee, payload)

    session.flash('success', 'Note ajoutée')
    return response.redirect().back()
  }

  /**
   * Update a note (author only).
   */
  public async update({ auth, params, request, response, session }: HttpContext) {
    const note = await this.notesService.getEditableNote(auth.getUserOrFail(), Number(params.id))
    const payload = await request.validateUsing(updateNoteValidator)

    await this.notesService.update(note, payload)

    session.flash('success', 'Note mise à jour')
    return response.redirect().back()
  }

  /**
   * Delete a note (soft delete, author only).
   */
  public async destroy({ auth, params, response, session }: HttpContext) {
    const note = await this.notesService.getEditableNote(auth.getUserOrFail(), Number(params.id))

    await this.notesService.softDelete(note)

    session.flash('success', 'Note supprimée')
    return response.redirect().back()
  }
}
