import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import Notification from '#models/notification'
import PdfExport from '#models/pdf_export'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createAdvisor, createEmployeeFor } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'

/**
 * Synthèse candidat côté conseiller :
 * /dashboard/conseiller/employees/:id/synthesis[/share|/unshare|/pdf]
 */
const synthesisUrl = (employeeId: number) =>
  `/dashboard/conseiller/employees/${employeeId}/synthesis`

test.group('Conseiller — synthèse : page', (group) => {
  group.each.setup(() => truncateDb())

  test('crée la ligne de synthèse en brouillon et rend la page', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client.get(synthesisUrl(employee.id)).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/Synthesis', [
      'employeeId',
      'employee',
      'synthesis',
      'latestCompletedByType',
      'latestPdfJob',
    ])
    assert.equal(props.employeeId, String(employee.id))
    assert.equal(
      (props.synthesis as { shareStatus: string }).shareStatus,
      EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT
    )
    assert.isNull(props.latestPdfJob)

    const row = await EmployeeSynthesis.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(row.organizationId, advisor.organizationId)
  })

  test('expose le dernier résultat terminé par type et le dernier export PDF', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const completed = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.COMPLETED,
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.DRAFT,
    }).create()
    const pdf = await PdfExportFactory.merge({
      userId: advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'exports/pdf_export_1.pdf',
      fileName: 'fake.pdf',
    }).create()

    const response = await client.get(synthesisUrl(employee.id)).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/Synthesis')
    assert.deepEqual(props.latestCompletedByType, { [EXERCICE_RESULTS_TYPES.VALUES]: completed.id })
    assert.deepEqual(props.latestPdfJob, {
      id: pdf.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      downloadUrl: `/dashboard/pdf-exports/${pdf.id}/download`,
    })
  })

  test("un conseiller d'une autre organisation reçoit 404 sans créer de synthèse", async ({
    client,
    db,
  }) => {
    const employee = await createEmployeeFor(await createAdvisor())
    const intruder = await createAdvisor()

    const response = await client
      .get(synthesisUrl(employee.id))
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    await db.assertEmpty('employee_syntheses')
  })
})

test.group('Conseiller — synthèse : édition et partage', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre notes internes, commentaires partagés et résumé', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .put(synthesisUrl(employee.id))
      .header('referer', synthesisUrl(employee.id))
      .json({
        expertNotesInternal: 'Interne',
        expertCommentsShared: 'Partagé',
        executiveSummaryOverride: 'Résumé',
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', synthesisUrl(employee.id))
    assert.equal(response.flashMessage('success'), 'Synthèse mise à jour.')

    const row = await EmployeeSynthesis.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(row.expertNotesInternal, 'Interne')
    assert.equal(row.expertCommentsShared, 'Partagé')
    assert.equal(row.executiveSummaryOverride, 'Résumé')
  })

  test('partage puis retire le partage', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const share = await client
      .post(`${synthesisUrl(employee.id)}/share`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    share.assertStatus(302)
    assert.equal(share.flashMessage('success'), 'Synthèse partagée au talent.')

    let row = await EmployeeSynthesis.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(row.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)
    assert.equal(row.sharedByUserId, advisor.id)
    assert.isNotNull(row.sharedAt)

    const unshare = await client
      .post(`${synthesisUrl(employee.id)}/unshare`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    unshare.assertStatus(302)
    assert.equal(unshare.flashMessage('success'), 'Partage désactivé.')

    row = await EmployeeSynthesis.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(row.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT)
    assert.isNull(row.sharedByUserId)
    assert.isNull(row.sharedAt)
  })

  test("un conseiller d'une autre organisation ne peut ni éditer ni partager (404)", async ({
    client,
    db,
  }) => {
    const employee = await createEmployeeFor(await createAdvisor())
    const intruder = await createAdvisor()

    for (const request of [
      client.put(synthesisUrl(employee.id)).json({ expertNotesInternal: 'x' }),
      client.post(`${synthesisUrl(employee.id)}/share`),
      client.post(`${synthesisUrl(employee.id)}/unshare`),
    ]) {
      const response = await request
        .header('Accept', 'application/json')
        .loginAs(intruder)
        .redirects(0)
      response.assertStatus(404)
    }

    await db.assertEmpty('employee_syntheses')
  })
})

test.group('Conseiller — synthèse : génération PDF', (group) => {
  let disk: ReturnType<typeof drive.fake>
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    disk = drive.fake()
    return () => drive.restore()
  })

  test('refuse la génération tant que la synthèse n’est pas partagée', async ({
    client,
    assert,
    db,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      sharedAt: null,
    }).create()

    const response = await client
      .post(`${synthesisUrl(employee.id)}/pdf`)
      .header('referer', synthesisUrl(employee.id))
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', synthesisUrl(employee.id))
    assert.equal(
      response.flashMessage('error'),
      'La synthèse doit être partagée avant génération PDF.'
    )
    await db.assertEmpty('pdf_exports')
  })

  test("refuse la génération pour le candidat d'une autre organisation", async ({
    client,
    assert,
    db,
  }) => {
    const owner = await createAdvisor()
    const employee = await createEmployeeFor(owner)
    await EmployeeSynthesisFactory.merge({
      organizationId: owner.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    }).create()
    const intruder = await createAdvisor()

    const response = await client
      .post(`${synthesisUrl(employee.id)}/pdf`)
      .loginAs(intruder)
      .withInertia()
      .redirects(0)

    // La synthèse est cherchée dans l'organisation de l'intrus : introuvable
    response.assertStatus(302)
    assert.equal(
      response.flashMessage('error'),
      'La synthèse doit être partagée avant génération PDF.'
    )
    await db.assertEmpty('pdf_exports')
  })

  test('crée un export PDF et le traite (queue sync en test)', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    }).create()

    const response = await client
      .post(`${synthesisUrl(employee.id)}/pdf`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('success'), 'Génération PDF lancée.')

    const pdf = await PdfExport.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(pdf.userId, advisor.id)
    assert.equal(pdf.advisorUserId, advisor.id)
    assert.equal(pdf.organizationId, advisor.organizationId)
    assert.equal(pdf.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.equal(pdf.mimeType, 'application/pdf')
    assert.isAbove(pdf.size ?? 0, 0)
    disk.assertExists(pdf.filePath!)

    // userId et advisorUserId désignent ici le même conseiller : deux notifications
    const notifications = await Notification.query().where('userId', advisor.id)
    assert.lengthOf(notifications, 2)
    assert.isTrue(notifications.every((n) => n.type === NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED))
  }).timeout(30_000)
})
