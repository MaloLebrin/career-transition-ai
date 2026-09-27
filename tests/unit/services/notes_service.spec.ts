import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import {
  NoteForbiddenError,
  NoteLinkedResourceNotFoundError,
  NoteNotFoundError,
} from '#exceptions/note_errors'
import Organization from '#models/organization'
import { NotesService } from '#services/notes_service'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import {
  createAdmin,
  createAdvisor,
  createEmployeeFor,
  createSuperAdmin,
} from '#tests/support/actors'
import { countQueries } from '#tests/utils/query_counter'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('NotesService — création', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('un conseiller crée une note sur un candidat de son organisation', async ({ assert }) => {
    const service = new NotesService()
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const target = await service.getEmployeeForNewNote(advisor, employee.id)
    const note = await service.create(advisor, target, {
      content: 'Bon entretien',
      visibility: NOTE_VISIBILITY.SHARED,
    })

    assert.equal(note.employeeId, employee.id)
    assert.equal(note.authorId, advisor.id)
    assert.equal(note.organizationId, advisor.organizationId)
    assert.isNull(note.supportPlanStepId)
    assert.isNull(note.exerciseResultId)
  })

  test('un admin d’organisation peut aussi écrire', async ({ assert }) => {
    const admin = await createAdmin()
    const employee = await createEmployeeFor(admin)

    const target = await new NotesService().getEmployeeForNewNote(admin, employee.id)
    assert.equal(target.id, employee.id)
  })

  test('un super admin est refusé (NoteForbiddenError, 403)', async ({ assert }) => {
    const superAdmin = await createSuperAdmin()
    const employee = await createEmployeeFor(superAdmin)

    const error = await new NotesService()
      .getEmployeeForNewNote(superAdmin, employee.id)
      .catch((e) => e)
    assert.instanceOf(error, NoteForbiddenError)
    assert.equal(error.status, 403)
  })

  test("un candidat d'une autre organisation est introuvable (404)", async ({ assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const intruder = await createAdvisor()

    const error = await new NotesService()
      .getEmployeeForNewNote(intruder, employee.id)
      .catch((e) => e)
    assert.instanceOf(error, NoteNotFoundError)
    assert.equal(error.status, 404)
  })

  test("refuse une étape ou un résultat qui n'appartient pas au candidat (400)", async ({
    assert,
  }) => {
    const service = new NotesService()
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const other = await createEmployeeFor(advisor)
    const foreignStep = await SupportPlanStepFactory.merge({ employeeId: other.id }).create()
    const foreignResult = await ExerciseResultFactory.merge({ employeeId: other.id }).create()

    const stepError = await service
      .create(advisor, employee, {
        content: 'x',
        visibility: NOTE_VISIBILITY.PRIVATE,
        supportPlanStepId: foreignStep.id,
      })
      .catch((e) => e)
    assert.instanceOf(stepError, NoteLinkedResourceNotFoundError)
    assert.equal(stepError.message, 'Support plan step not found')

    const resultError = await service
      .create(advisor, employee, {
        content: 'x',
        visibility: NOTE_VISIBILITY.PRIVATE,
        exerciseResultId: foreignResult.id,
      })
      .catch((e) => e)
    assert.instanceOf(resultError, NoteLinkedResourceNotFoundError)
    assert.equal(resultError.message, 'Exercise result not found')
  })
})

test.group('NotesService — modification et suppression', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("getEditableNote charge la note de l'auteur en une seule requête", async ({ assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
    }).create()

    const queries = await countQueries(
      async () => {
        const found = await new NotesService().getEditableNote(advisor, note.id)
        assert.equal(found.id, note.id)
      },
      { table: 'notes' }
    )
    assert.equal(queries, 1)
  })

  test("un collègue de l'organisation qui n'est pas l'auteur est refusé (403)", async ({
    assert,
  }) => {
    const author = await createAdvisor()
    const employee = await createEmployeeFor(author)
    const colleague = await createAdvisor(await Organization.findOrFail(author.organizationId))
    const note = await NoteFactory.merge({
      organizationId: author.organizationId,
      employeeId: employee.id,
      authorId: author.id,
    }).create()

    const error = await new NotesService().getEditableNote(colleague, note.id).catch((e) => e)
    assert.instanceOf(error, NoteForbiddenError)
  })

  test("une note d'une autre organisation est introuvable (404)", async ({ assert }) => {
    const author = await createAdvisor()
    const employee = await createEmployeeFor(author)
    const intruder = await createAdvisor()
    const note = await NoteFactory.merge({
      organizationId: author.organizationId,
      employeeId: employee.id,
      authorId: author.id,
    }).create()

    const error = await new NotesService().getEditableNote(intruder, note.id).catch((e) => e)
    assert.instanceOf(error, NoteNotFoundError)
  })

  test('update conserve les champs absents', async ({ assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      content: 'Inchangé',
      visibility: NOTE_VISIBILITY.PRIVATE,
    }).create()

    await new NotesService().update(note, { visibility: NOTE_VISIBILITY.SHARED })

    await note.refresh()
    assert.equal(note.content, 'Inchangé')
    assert.equal(note.visibility, NOTE_VISIBILITY.SHARED)
  })

  test("softDelete garde la ligne et la note n'est plus modifiable", async ({ assert }) => {
    const service = new NotesService()
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
    }).create()

    await service.softDelete(note)

    await note.refresh()
    assert.isNotNull(note.deletedAt)
    const error = await service.getEditableNote(advisor, note.id).catch((e) => e)
    assert.instanceOf(error, NoteNotFoundError)
  })
})
