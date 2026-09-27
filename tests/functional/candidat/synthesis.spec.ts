import { test } from '@japa/runner'
import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import {
  EMPLOYEE_SYNTHESIS_SHARE_STATUSES,
  type EmployeeSynthesisShareStatus,
} from '#models/employee_synthesis'
import type Employee from '#models/employee'
import PdfExport from '#models/pdf_export'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createAdvisor, createCandidate, createOrganization } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { DateTime } from 'luxon'
import { rm } from 'node:fs/promises'

/**
 * Synthèse côté candidat (`EmployeeSynthesesController`) :
 * - `GET  /dashboard/candidat/synthesis`     → `showCandidate` ;
 * - `POST /dashboard/candidat/synthesis/pdf` → `generateShareablePdfCandidate`.
 *
 * Tant que le conseiller n'a pas **partagé** la synthèse, le candidat ne voit
 * qu'une page vide et ne peut pas lancer d'export PDF.
 */

const URL = '/dashboard/candidat/synthesis'
const PAGE = 'dashboard/candidat/Synthesis'

function synthesisFor(employee: Employee, shareStatus: EmployeeSynthesisShareStatus) {
  const shared = shareStatus === EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
  return EmployeeSynthesisFactory.merge({
    organizationId: employee.organizationId,
    employeeId: employee.id,
    shareStatus,
    sharedAt: shared ? DateTime.now() : null,
    expertCommentsShared: shared ? 'Commentaire partagé' : null,
    expertNotesInternal: 'Notes internes du conseiller',
  }).create()
}

test.group('Candidat — synthèse : page (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('sans synthèse : page « non partagée » sans contenu', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, [
      'shared',
      'employeeId',
      'employee',
      'synthesis',
      'latestCompletedByType',
      'latestPdfJob',
    ])
    assert.isFalse(props.shared)
    assert.equal(props.employeeId, String(employee.id))
    assert.isNull(props.employee)
    assert.isNull(props.synthesis)
    assert.isNull(props.latestPdfJob)
  })

  test('synthèse en brouillon : rien ne fuit vers le candidat', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await synthesisFor(employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT)

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.isFalse(props.shared)
    assert.isNull(props.synthesis)
  })

  test('synthèse partagée : contenu visible, sans les notes internes', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await synthesisFor(employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.isTrue(props.shared)
    const synthesis = props.synthesis as Record<string, unknown>
    assert.equal(synthesis.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)
    assert.equal(synthesis.expertCommentsShared, 'Commentaire partagé')
    assert.notProperty(synthesis, 'expertNotesInternal')
    assert.notInclude(JSON.stringify(props), 'Notes internes du conseiller')
    assert.isNull(props.latestPdfJob)
  })

  test('synthèse partagée : expose le dernier export PDF du candidat', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await synthesisFor(employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)
    const pdfExport = await PdfExport.create({
      userId: user.id,
      organizationId: employee.organizationId,
      employeeId: employee.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    const job = props.latestPdfJob as { id: number; status: string; downloadUrl: string | null }
    assert.equal(job.id, pdfExport.id)
    assert.equal(job.status, PDF_EXPORT_STATUSES.PENDING)
    assert.isNull(job.downloadUrl)
  })

  test("n'affiche pas la synthèse partagée d'un autre candidat", async ({ client, assert }) => {
    const { user } = await createCandidate()
    const other = await createCandidate()
    await synthesisFor(other.employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    assert.isFalse(props.shared)
    assert.isNull(props.synthesis)
  })

  test("renvoie vers l'onboarding un candidat non onboardé", async ({ client }) => {
    const { user } = await createCandidate({ onboarded: false })

    const response = await client.get(URL).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(URL).loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })
})

test.group('Candidat — synthèse : export PDF (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test("refuse l'export tant que la synthèse n'est pas partagée", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await synthesisFor(employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT)

    const response = await client
      .post(`${URL}/pdf`)
      .loginAs(user)
      .header('referer', URL)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', URL)
    response.assertFlashMessage('error', 'La synthèse doit être partagée avant génération PDF.')
    assert.lengthOf(await PdfExport.all(), 0)
  })

  test("refuse l'export sans synthèse", async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(`${URL}/pdf`)
      .loginAs(user)
      .header('referer', URL)
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('error', 'La synthèse doit être partagée avant génération PDF.')
    assert.lengthOf(await PdfExport.all(), 0)
  })

  test('synthèse partagée : crée l’export, génère le PDF et revient à la page', async ({
    client,
    assert,
  }) => {
    const organization = await createOrganization()
    const advisor = await createAdvisor(organization)
    const { user, employee } = await createCandidate({ organization, advisor })
    await synthesisFor(employee, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)

    const response = await client
      .post(`${URL}/pdf`)
      .loginAs(user)
      .header('referer', URL)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', URL)
    response.assertFlashMessage('success', 'Génération PDF lancée.')

    const exports = await PdfExport.query().where('employeeId', employee.id)
    assert.lengthOf(exports, 1)
    const [pdfExport] = exports
    assert.equal(pdfExport.userId, user.id)
    assert.equal(pdfExport.organizationId, employee.organizationId)
    assert.equal(pdfExport.advisorUserId, advisor.id)
    // Queue `sync` en test : le job a déjà tourné.
    assert.equal(pdfExport.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.equal(pdfExport.mimeType, 'application/pdf')
    assert.isAbove(pdfExport.size ?? 0, 0)

    if (pdfExport.filePath) await rm(pdfExport.filePath, { force: true })
  })

  test('refuse un conseiller (403)', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client.post(`${URL}/pdf`).loginAs(advisor).redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await PdfExport.all(), 0)
  })
})
