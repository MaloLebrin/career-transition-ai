import { test } from '@japa/runner'
import NotesController from '#controllers/notes_controller'
import {
  NoteForbiddenError,
  NoteLinkedResourceNotFoundError,
  NoteNotFoundError,
} from '#exceptions/note_errors'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import { createNoteValidator } from '#validators/note/create_note_validator'
import { updateNoteValidator } from '#validators/note/update_note_validator'

/**
 * Unit — `NotesController` : `NotesService` factice injecté par le constructeur.
 * Les erreurs de domaine levées par le service remontent telles quelles
 * (`handler.ts` les rend) : aucun flash ni redirection dans ce cas.
 */

const USER = { id: 5, organizationId: 2 }
const EMPLOYEE = { id: 40, organizationId: 2 }
const NOTE = { id: 90, authorId: USER.id }

class FakeNotesService {
  public employeeCalls: Array<{ user: unknown; employeeId: number }> = []
  public editableCalls: Array<{ user: unknown; noteId: number }> = []
  public createCalls: Array<{ user: unknown; employee: unknown; input: unknown }> = []
  public updateCalls: Array<{ note: unknown; input: unknown }> = []
  public softDeleteCalls: unknown[] = []

  public employeeError: Error | null = null
  public editableError: Error | null = null
  public createError: Error | null = null

  async getEmployeeForNewNote(user: unknown, employeeId: number) {
    this.employeeCalls.push({ user, employeeId })
    if (this.employeeError) throw this.employeeError
    return EMPLOYEE
  }

  async getEditableNote(user: unknown, noteId: number) {
    this.editableCalls.push({ user, noteId })
    if (this.editableError) throw this.editableError
    return NOTE
  }

  async create(user: unknown, employee: unknown, input: unknown) {
    this.createCalls.push({ user, employee, input })
    if (this.createError) throw this.createError
    return { id: 1 }
  }

  async update(note: unknown, input: unknown) {
    this.updateCalls.push({ note, input })
    return note
  }

  async softDelete(note: unknown) {
    this.softDeleteCalls.push(note)
  }
}

function makeSession() {
  const flashes: Array<[string, string]> = []
  return {
    flashes,
    flash(key: string, value: string) {
      flashes.push([key, value])
    },
  }
}

function makeResponse() {
  const state = { redirectedBack: false }
  return {
    state,
    redirect() {
      return {
        back() {
          state.redirectedBack = true
        },
      }
    },
  }
}

function makeRequest(payload: unknown) {
  const validators: unknown[] = []
  return {
    validators,
    validateUsing(validator: unknown) {
      validators.push(validator)
      return Promise.resolve(payload)
    },
  }
}

function makeContext(params: Record<string, string>, payload: unknown = {}) {
  const session = makeSession()
  const response = makeResponse()
  const request = makeRequest(payload)
  const ctx = {
    auth: { getUserOrFail: () => USER },
    params,
    request,
    response,
    session,
  } as any
  return { ctx, session, response, request }
}

const createPayload = { content: 'Bon entretien', visibility: NOTE_VISIBILITY.PRIVATE }

test.group('NotesController.store', () => {
  test('crée la note pour le candidat de la route puis redirige en arrière', async ({ assert }) => {
    const service = new FakeNotesService()
    const controller = new NotesController(service as any)
    const { ctx, session, response, request } = makeContext({ id: '40' }, createPayload)

    await controller.store(ctx)

    assert.deepEqual(service.employeeCalls, [{ user: USER, employeeId: 40 }])
    assert.deepEqual(request.validators, [createNoteValidator])
    assert.deepEqual(service.createCalls, [
      { user: USER, employee: EMPLOYEE, input: createPayload },
    ])
    assert.deepEqual(session.flashes, [['success', 'Note ajoutée']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('accepte le paramètre de route employeeId', async ({ assert }) => {
    const service = new FakeNotesService()
    const controller = new NotesController(service as any)
    const { ctx } = makeContext({ employeeId: '12' }, createPayload)

    await controller.store(ctx)

    assert.equal(service.employeeCalls[0].employeeId, 12)
  })

  test('propage NoteForbiddenError avant toute validation', async ({ assert }) => {
    const service = new FakeNotesService()
    service.employeeError = new NoteForbiddenError('Only advisors can create notes')
    const controller = new NotesController(service as any)
    const { ctx, session, response, request } = makeContext({ id: '40' }, createPayload)

    try {
      await controller.store(ctx)
      assert.fail('store aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, NoteForbiddenError)
    }

    assert.lengthOf(request.validators, 0)
    assert.lengthOf(service.createCalls, 0)
    assert.lengthOf(session.flashes, 0)
    assert.isFalse(response.state.redirectedBack)
  })

  test('propage NoteNotFoundError (candidat hors organisation)', async ({ assert }) => {
    const service = new FakeNotesService()
    service.employeeError = new NoteNotFoundError('Employee not found')
    const controller = new NotesController(service as any)
    const { ctx } = makeContext({ id: '999' }, createPayload)

    try {
      await controller.store(ctx)
      assert.fail('store aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, NoteNotFoundError)
    }
    assert.lengthOf(service.createCalls, 0)
  })

  test('propage NoteLinkedResourceNotFoundError levée par create, sans flash', async ({
    assert,
  }) => {
    const service = new FakeNotesService()
    service.createError = new NoteLinkedResourceNotFoundError('Support plan step not found')
    const controller = new NotesController(service as any)
    const { ctx, session, response } = makeContext(
      { id: '40' },
      { ...createPayload, supportPlanStepId: 3 }
    )

    try {
      await controller.store(ctx)
      assert.fail('store aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, NoteLinkedResourceNotFoundError)
    }
    assert.lengthOf(session.flashes, 0)
    assert.isFalse(response.state.redirectedBack)
  })
})

test.group('NotesController.update', () => {
  test('met à jour la note éditable puis redirige en arrière', async ({ assert }) => {
    const service = new FakeNotesService()
    const controller = new NotesController(service as any)
    const payload = { content: 'Modifiée' }
    const { ctx, session, response, request } = makeContext({ id: '90' }, payload)

    await controller.update(ctx)

    assert.deepEqual(service.editableCalls, [{ user: USER, noteId: 90 }])
    assert.deepEqual(request.validators, [updateNoteValidator])
    assert.deepEqual(service.updateCalls, [{ note: NOTE, input: payload }])
    assert.deepEqual(session.flashes, [['success', 'Note mise à jour']])
    assert.isTrue(response.state.redirectedBack)
  })

  test("propage NoteForbiddenError si l'utilisateur n'est pas l'auteur", async ({ assert }) => {
    const service = new FakeNotesService()
    service.editableError = new NoteForbiddenError('Only the author can edit this note')
    const controller = new NotesController(service as any)
    const { ctx, session, request } = makeContext({ id: '90' }, { content: 'x' })

    try {
      await controller.update(ctx)
      assert.fail('update aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, NoteForbiddenError)
    }
    assert.lengthOf(request.validators, 0)
    assert.lengthOf(service.updateCalls, 0)
    assert.lengthOf(session.flashes, 0)
  })
})

test.group('NotesController.destroy', () => {
  test('supprime (soft delete) la note éditable puis redirige en arrière', async ({ assert }) => {
    const service = new FakeNotesService()
    const controller = new NotesController(service as any)
    const { ctx, session, response } = makeContext({ id: '90' })

    await controller.destroy(ctx)

    assert.deepEqual(service.editableCalls, [{ user: USER, noteId: 90 }])
    assert.deepEqual(service.softDeleteCalls, [NOTE])
    assert.deepEqual(session.flashes, [['success', 'Note supprimée']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('propage NoteNotFoundError sans rien supprimer', async ({ assert }) => {
    const service = new FakeNotesService()
    service.editableError = new NoteNotFoundError()
    const controller = new NotesController(service as any)
    const { ctx, session, response } = makeContext({ id: '404' })

    try {
      await controller.destroy(ctx)
      assert.fail('destroy aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, NoteNotFoundError)
    }
    assert.lengthOf(service.softDeleteCalls, 0)
    assert.lengthOf(session.flashes, 0)
    assert.isFalse(response.state.redirectedBack)
  })
})
