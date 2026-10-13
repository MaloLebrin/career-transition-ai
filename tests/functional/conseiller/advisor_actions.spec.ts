import { EmployeeFactory } from '#database/factories/employee_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Note from '#models/note'
import PdfExport from '#models/pdf_export'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import {
  createAdvisor,
  createEmployeeFor,
  createCandidate,
  createOrganization,
} from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { fakeMail, restoreMail } from './helpers.js'
import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'

/**
 * Actions du conseiller sur une fiche candidat (#72) : archiver / restaurer,
 * réinitialiser un exercice, relancer ou supprimer un export PDF en échec.
 * (Le renvoi d'invitation est couvert dans `employees.spec.ts`.)
 */
const BASE = '/dashboard/conseiller/employees'

test.group('Conseiller — archiver et restaurer un candidat', (group) => {
  group.each.setup(() => truncateDb())

  test('archive puis restaure : statut `archived`, puis `active` (onboardé)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await employee.merge({ onboarded: true, status: EMPLOYEES_STATUS.ACTIVE }).save()

    const archived = await client
      .post(`${BASE}/${employee.id}/archive`)
      .header('referer', `${BASE}/${employee.id}`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    archived.assertStatus(302)
    assert.equal(archived.flashMessage('success'), 'Candidat archivé.')
    await employee.refresh()
    assert.equal(employee.status, EMPLOYEES_STATUS.ARCHIVED)

    const restored = await client
      .post(`${BASE}/${employee.id}/restore`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assert.equal(restored.flashMessage('success'), 'Candidat restauré.')
    await employee.refresh()
    assert.equal(employee.status, EMPLOYEES_STATUS.ACTIVE)
  })

  test('restaurer un candidat non activé le remet en onboarding', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      onboarded: false,
      status: EMPLOYEES_STATUS.ARCHIVED,
    }).create()

    await client.post(`${BASE}/${employee.id}/restore`).loginAs(advisor).withInertia().redirects(0)

    await employee.refresh()
    assert.equal(employee.status, EMPLOYEES_STATUS.ONBOARDING)
  })

  test('candidat d’une autre organisation → 404, statut inchangé', async ({ client, assert }) => {
    const otherOrg = await createOrganization()
    const other = await EmployeeFactory.merge({
      organizationId: otherOrg.id,
      status: EMPLOYEES_STATUS.ACTIVE,
    }).create()
    const intruder = await createAdvisor()

    const response = await client
      .post(`${BASE}/${other.id}/archive`)
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    const untouched = await Employee.findOrFail(other.id)
    assert.equal(untouched.status, EMPLOYEES_STATUS.ACTIVE)
  })

  test('un candidat connecté ne peut pas archiver (403)', async ({ client }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const candidate = await createCandidate()
    const candidateUser = candidate.user

    const response = await client
      .post(`${BASE}/${employee.id}/archive`)
      .header('Accept', 'application/json')
      .loginAs(candidateUser)
      .redirects(0)

    response.assertStatus(403)
  })
})

test.group('Conseiller — réinitialiser un exercice', (group) => {
  group.each.setup(() => truncateDb())

  test('supprime les résultats du type (et leurs notes), pas ceux des autres exercices', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const values = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).create()
    const disc = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
    }).create()
    const note = await NoteFactory.merge({
      employeeId: employee.id,
      authorId: advisor.id,
      organizationId: advisor.organizationId,
      exerciseResultId: values.id,
    }).create()

    const response = await client
      .delete(`${BASE}/${employee.id}/exercises/results/values`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', `${BASE}/${employee.id}/exercises`)
    assert.equal(response.flashMessage('success'), 'Exercice réinitialisé.')
    assert.isNull(await ExerciseResult.find(values.id))
    assert.isNull(await Note.find(note.id))
    assert.isNotNull(await ExerciseResult.find(disc.id))
  })

  test('aucun résultat ou type inconnu → 404', async ({ client }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const empty = await client
      .delete(`${BASE}/${employee.id}/exercises/results/values`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)
    const unknown = await client
      .delete(`${BASE}/${employee.id}/exercises/results/nimporte-quoi`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)

    empty.assertStatus(404)
    unknown.assertStatus(404)
  })

  test('candidat d’une autre organisation → 404, résultats conservés', async ({
    client,
    assert,
  }) => {
    const otherOrg = await createOrganization()
    const other = await EmployeeFactory.merge({ organizationId: otherOrg.id }).create()
    const result = await ExerciseResultFactory.merge({
      employeeId: other.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).create()
    const intruder = await createAdvisor()

    const response = await client
      .delete(`${BASE}/${other.id}/exercises/results/values`)
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    assert.isNotNull(await ExerciseResult.find(result.id))
  })
})

test.group('Conseiller — exports PDF en échec', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    fakeMail()
    swapFakeCloudinary()
    return () => {
      restoreMail()
      restoreCloudinary()
    }
  })

  async function exportFor(
    advisorId: number,
    organizationId: number,
    employeeId: number,
    status: PdfExportStatus
  ) {
    return PdfExportFactory.merge({
      userId: advisorId,
      organizationId,
      employeeId,
      status,
      errorMessage: status === PDF_EXPORT_STATUSES.FAILED ? 'Boom' : null,
      filePath: null,
    }).create()
  }

  test('relancer régénère le même export (queue sync en test) et efface l’erreur', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    }).create()
    const failed = await exportFor(
      advisor.id,
      advisor.organizationId,
      employee.id,
      PDF_EXPORT_STATUSES.FAILED
    )

    const response = await client
      .post(`${BASE}/${employee.id}/synthesis/pdf/${failed.id}/retry`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('success'), 'Génération PDF relancée.')
    await failed.refresh()
    assert.equal(failed.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.isNull(failed.errorMessage)
    assert.lengthOf(await PdfExport.query().where('employeeId', employee.id), 1)
  })

  test('supprimer retire l’export en échec', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const failed = await exportFor(
      advisor.id,
      advisor.organizationId,
      employee.id,
      PDF_EXPORT_STATUSES.FAILED
    )

    const response = await client
      .delete(`${BASE}/${employee.id}/synthesis/pdf/${failed.id}`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assert.equal(response.flashMessage('success'), 'Export PDF supprimé.')
    assert.isNull(await PdfExport.find(failed.id))
  })

  test('un export terminé ne peut être ni relancé ni supprimé (409)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const done = await exportFor(
      advisor.id,
      advisor.organizationId,
      employee.id,
      PDF_EXPORT_STATUSES.COMPLETED
    )

    const retry = await client
      .post(`${BASE}/${employee.id}/synthesis/pdf/${done.id}/retry`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)
    const destroy = await client
      .delete(`${BASE}/${employee.id}/synthesis/pdf/${done.id}`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)

    retry.assertStatus(409)
    destroy.assertStatus(409)
    assert.isNotNull(await PdfExport.find(done.id))
  })

  test('export d’un autre candidat ou d’une autre organisation → 404', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const mine = await createEmployeeFor(advisor)
    const otherOrg = await createOrganization()
    const stranger = await EmployeeFactory.merge({ organizationId: otherOrg.id }).create()
    const foreign = await exportFor(
      advisor.id,
      otherOrg.id,
      stranger.id,
      PDF_EXPORT_STATUSES.FAILED
    )

    const crossEmployee = await client
      .delete(`${BASE}/${mine.id}/synthesis/pdf/${foreign.id}`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)
    const crossOrg = await client
      .delete(`${BASE}/${stranger.id}/synthesis/pdf/${foreign.id}`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)

    crossEmployee.assertStatus(404)
    crossOrg.assertStatus(404)
    assert.isNotNull(await PdfExport.find(foreign.id))
  })
})
