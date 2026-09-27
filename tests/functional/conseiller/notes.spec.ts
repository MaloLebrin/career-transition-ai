import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import Note from '#models/note'
import Organization from '#models/organization'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import {
  createAdmin,
  createAdvisor,
  createEmployeeFor,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertFieldErrors, assertNoFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Notes conseiller :
 * - POST   /dashboard/conseiller/employees/:id/notes
 * - PUT    /dashboard/conseiller/notes/:id
 * - DELETE /dashboard/conseiller/notes/:id
 *
 * Toutes les réponses de succès sont des `redirect().back()` : on fixe le
 * `referer` pour pouvoir épingler la cible de la redirection.
 */
const referer = (employeeId: number) => `/dashboard/conseiller/employees/${employeeId}`

test.group('Conseiller — notes : création', (group) => {
  group.each.setup(() => truncateDb())

  test('un conseiller crée une note partagée sur un candidat de son organisation', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .header('referer', referer(employee.id))
      .form({ content: '  Très bon entretien  ', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', referer(employee.id))
    assertNoFieldErrors(assert, response)
    assert.equal(response.flashMessage('success'), 'Note ajoutée')

    const note = await Note.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(note.content, 'Très bon entretien')
    assert.equal(note.visibility, NOTE_VISIBILITY.SHARED)
    assert.equal(note.authorId, advisor.id)
    assert.equal(note.organizationId, advisor.organizationId)
    assert.isNull(note.supportPlanStepId)
    assert.isNull(note.exerciseResultId)
  })

  test('un admin peut aussi créer une note', async ({ client, assert, db }) => {
    const admin = await createAdmin()
    const employee = await createEmployeeFor(admin)

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .form({ content: 'Note admin', visibility: NOTE_VISIBILITY.PRIVATE })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    await db.assertHas('notes', { employee_id: employee.id, author_id: admin.id })
  })

  test('rattache la note à une étape et à un résultat du candidat', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      advisorId: advisor.id,
    }).create()
    const result = await ExerciseResultFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .json({
        content: 'Liée',
        visibility: NOTE_VISIBILITY.PRIVATE,
        supportPlanStepId: step.id,
        exerciseResultId: result.id,
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    const note = await Note.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(note.supportPlanStepId, step.id)
    assert.equal(note.exerciseResultId, result.id)
  })

  test("refuse une étape qui n'appartient pas au candidat (400)", async ({
    client,
    assert,
    db,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const other = await createEmployeeFor(advisor)
    const foreignStep = await SupportPlanStepFactory.merge({ employeeId: other.id }).create()

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .json({
        content: 'x',
        visibility: NOTE_VISIBILITY.PRIVATE,
        supportPlanStepId: foreignStep.id,
      })
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ message: 'Support plan step not found' })
    await db.assertEmpty('notes')
  })

  test("refuse un résultat d'exercice qui n'appartient pas au candidat (400)", async ({
    client,
    assert,
    db,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const other = await createEmployeeFor(advisor)
    const foreignResult = await ExerciseResultFactory.merge({ employeeId: other.id }).create()

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .json({
        content: 'x',
        visibility: NOTE_VISIBILITY.PRIVATE,
        exerciseResultId: foreignResult.id,
      })
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ message: 'Exercise result not found' })
    await db.assertEmpty('notes')
  })

  test('rejette un contenu vide et une visibilité inconnue', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .header('referer', referer(employee.id))
      .form({ content: '   ', visibility: 'public' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['content', 'visibility'])
    await db.assertEmpty('notes')
  })

  test("un conseiller d'une autre organisation reçoit 404", async ({ client, assert, db }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const intruder = await createAdvisor()

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .json({ content: 'intrusion', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    await db.assertEmpty('notes')
  })

  test('un super admin est refusé par le contrôleur (403)', async ({ client, assert, db }) => {
    const superAdmin = await createSuperAdmin()
    const employee = await createEmployeeFor(superAdmin)

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/notes`)
      .json({ content: 'x', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(superAdmin)
      .redirects(0)

    response.assertStatus(403)
    await db.assertEmpty('notes')
  })
})

test.group('Conseiller — notes : modification et suppression', (group) => {
  group.each.setup(() => truncateDb())

  test("l'auteur modifie le contenu et la visibilité", async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.PRIVATE,
      content: 'Avant',
    }).create()

    const response = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .header('referer', referer(employee.id))
      .form({ content: 'Après', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    // Inertia convertit la redirection d'un PUT/PATCH/DELETE en 303
    response.assertStatus(303)
    response.assertHeader('location', referer(employee.id))
    assert.equal(response.flashMessage('success'), 'Note mise à jour')

    await note.refresh()
    assert.equal(note.content, 'Après')
    assert.equal(note.visibility, NOTE_VISIBILITY.SHARED)
  })

  test('une modification partielle conserve les champs absents', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.PRIVATE,
      content: 'Inchangé',
    }).create()

    await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .form({ visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    await note.refresh()
    assert.equal(note.content, 'Inchangé')
    assert.equal(note.visibility, NOTE_VISIBILITY.SHARED)
  })

  test('rejette une visibilité inconnue à la modification', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      content: 'Original',
    }).create()

    const response = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .json({ content: 'Nouveau', visibility: 'public' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.deepEqual(Object.keys(inertiaErrors(response)), ['visibility'])
    await note.refresh()
    assert.equal(note.content, 'Original')
  })

  test('un contenu blanc est ignoré (le bodyparser le convertit en null)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      content: 'Original',
    }).create()

    const response = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .json({ content: '   ' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    await note.refresh()
    assert.equal(note.content, 'Original')
  })

  test("un autre conseiller de l'organisation ne peut ni modifier ni supprimer (403)", async ({
    client,
    assert,
  }) => {
    const author = await createAdvisor()
    const employee = await createEmployeeFor(author)
    const colleague = await createAdvisor(await Organization.findOrFail(author.organizationId))
    const note = await NoteFactory.merge({
      organizationId: author.organizationId,
      employeeId: employee.id,
      authorId: author.id,
      content: 'Original',
    }).create()

    const update = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .json({ content: 'Piraté' })
      .loginAs(colleague)
      .redirects(0)
    update.assertStatus(403)

    const destroy = await client
      .delete(`/dashboard/conseiller/notes/${note.id}`)
      .loginAs(colleague)
      .redirects(0)
    destroy.assertStatus(403)

    await note.refresh()
    assert.equal(note.content, 'Original')
    assert.isNull(note.deletedAt)
  })

  test("en requête Inertia, le refus d'un non-auteur est flashé avec redirection", async ({
    client,
    assert,
  }) => {
    const author = await createAdvisor()
    const employee = await createEmployeeFor(author)
    const colleague = await createAdvisor(await Organization.findOrFail(author.organizationId))
    const note = await NoteFactory.merge({
      organizationId: author.organizationId,
      employeeId: employee.id,
      authorId: author.id,
      content: 'Original',
    }).create()

    // Erreur métier (`NoteForbiddenError`) rendue par le handler : pas de JSON
    // brut qu'Inertia afficherait dans une modale.
    const response = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .header('referer', referer(employee.id))
      .form({ content: 'Piraté' })
      .loginAs(colleague)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', referer(employee.id))
    assert.equal(response.flashMessage('error'), 'Only the author can edit this note')
    await note.refresh()
    assert.equal(note.content, 'Original')
  })

  test("un conseiller d'une autre organisation reçoit 404", async ({ client, assert }) => {
    const author = await createAdvisor()
    const employee = await createEmployeeFor(author)
    const intruder = await createAdvisor()
    const note = await NoteFactory.merge({
      organizationId: author.organizationId,
      employeeId: employee.id,
      authorId: author.id,
    }).create()

    const update = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .json({ content: 'Piraté' })
      .loginAs(intruder)
      .redirects(0)
    update.assertStatus(404)

    const destroy = await client
      .delete(`/dashboard/conseiller/notes/${note.id}`)
      .loginAs(intruder)
      .redirects(0)
    destroy.assertStatus(404)

    await note.refresh()
    assert.isNull(note.deletedAt)
  })

  test("la suppression est douce et une note supprimée n'est plus modifiable", async ({
    client,
    assert,
    db,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
    }).create()

    const response = await client
      .delete(`/dashboard/conseiller/notes/${note.id}`)
      .header('referer', referer(employee.id))
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', referer(employee.id))
    assert.equal(response.flashMessage('success'), 'Note supprimée')

    await note.refresh()
    assert.isNotNull(note.deletedAt)
    await db.assertCount('notes', 1)

    const again = await client
      .put(`/dashboard/conseiller/notes/${note.id}`)
      .json({ content: 'Résurrection' })
      .loginAs(advisor)
      .redirects(0)
    again.assertStatus(404)
  })

  test('une note inexistante renvoie 404', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .delete('/dashboard/conseiller/notes/999999')
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(404)
  })
})
