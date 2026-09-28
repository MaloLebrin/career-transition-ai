import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import type Employee from '#models/employee'
import type User from '#models/user'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createOrganization,
  createUser,
} from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * GET /dashboard/pdf-exports/:id/download
 *
 * Régression #63 : l'export était chargé sans borne d'organisation, puis la
 * réponse valait 400 (non terminé), 403 (autre organisation) ou 404 — de quoi
 * sonder les exports des autres cabinets. Tout export hors de portée répond
 * désormais 404, et le statut n'est examiné qu'après le contrôle d'accès.
 */
const url = (id: number | string) => `/dashboard/pdf-exports/${id}/download`

async function exportOf(
  employee: Employee,
  requester: User,
  status: PdfExportStatus = PDF_EXPORT_STATUSES.COMPLETED
) {
  const pdfExport = await PdfExportFactory.merge({
    userId: requester.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
    status,
    filePath: null,
    fileName: 'Synthese.pdf',
    mimeType: 'application/pdf',
  }).create()
  if (status === PDF_EXPORT_STATUSES.COMPLETED) {
    const key = pdfExportKey(employee.organizationId, pdfExport.id)
    await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
    pdfExport.filePath = key
    await pdfExport.save()
  }
  return pdfExport
}

test.group('Téléchargement d’un export PDF — portée', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('un conseiller télécharge un export de son organisation', async ({ client, assert }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)

    const response = await client.get(url(pdfExport.id)).loginAs(advisor)

    response.assertStatus(200)
    response.assertHeader('content-type', 'application/pdf')
    assert.include(response.header('content-disposition'), 'filename="Synthese.pdf"')
  })

  test('un expert télécharge un export de son organisation', async ({ client }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)
    const expert = await createUser(USERS_ROLES.EXPERT, org)

    const response = await client.get(url(pdfExport.id)).loginAs(expert)

    response.assertStatus(200)
  })

  test('export d’une autre organisation : 404, jamais 403', async ({ client }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pdfExport = await exportOf(employee, advisor)

    for (const intruder of [await createAdmin(), await createAdvisor()]) {
      const response = await client.get(url(pdfExport.id)).loginAs(intruder)
      response.assertStatus(404)
    }
  })

  test('export non terminé d’une autre organisation : 404, le statut ne fuit pas', async ({
    client,
  }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const { employee } = await createCandidate({ organization: org })
    const pending = await exportOf(employee, advisor, PDF_EXPORT_STATUSES.PENDING)

    const outsider = await client.get(url(pending.id)).loginAs(await createAdmin())
    const insider = await client.get(url(pending.id)).loginAs(advisor)

    outsider.assertStatus(404)
    insider.assertStatus(409)
  })

  test('un candidat ne télécharge pas l’export d’un autre candidat (404)', async ({ client }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const me = await createCandidate({ organization: org })
    const other = await createCandidate({ organization: org })
    const mine = await exportOf(me.employee, advisor)
    const theirs = await exportOf(other.employee, advisor)

    const own = await client.get(url(mine.id)).loginAs(me.user)
    const foreign = await client.get(url(theirs.id)).loginAs(me.user)

    own.assertStatus(200)
    foreign.assertStatus(404)
  })

  test('identifiant non numérique ou inexistant : 404', async ({ client }) => {
    const admin = await createAdmin()

    const notNumeric = await client.get(url('abc')).loginAs(admin)
    const missing = await client.get(url(999_999)).loginAs(admin)

    notNumeric.assertStatus(404)
    missing.assertStatus(404)
  })

  test('un visiteur non connecté est renvoyé vers la connexion', async ({ client }) => {
    const response = await client.get(url(1)).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})
