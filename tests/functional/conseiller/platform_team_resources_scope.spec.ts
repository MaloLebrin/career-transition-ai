import { MediaFactory } from '#database/factories/media_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import type Employee from '#models/employee'
import Media from '#models/media'
import Note from '#models/note'
import type User from '#models/user'
import { employeeMediaOwner } from '#services/candidate_documents_service'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createB2cCandidate, createInHouseExpert } from '#tests/support/actors'
import { PDF_BYTES, documentsOf } from '#tests/support/documents'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Régression #167 : dans l'organisation plateforme, un expert (ou conseiller)
 * n'accède qu'aux particuliers qui lui sont assignés (`teamEmployeeScope`). Les
 * documents, le téléchargement des exports PDF et la création de note ne
 * filtraient que par organisation : l'expert A atteignait, par énumération
 * d'ids, les fiches assignées à l'expert B. Hors périmètre → 404.
 */
const documentsUrl = (employeeId: number) =>
  `/dashboard/conseiller/employees/${employeeId}/documents`
const pdfUrl = (exportId: number) => `/dashboard/pdf-exports/${exportId}/download`
const notesUrl = (employeeId: number) => `/dashboard/conseiller/employees/${employeeId}/notes`

function documentOf(employee: Employee): Promise<Media> {
  return MediaFactory.merge(employeeMediaOwner(employee)).create()
}

async function completedExportOf(employee: Employee, requester: User) {
  const pdfExport = await PdfExportFactory.merge({
    userId: requester.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
    status: PDF_EXPORT_STATUSES.COMPLETED,
    fileName: 'Synthese.pdf',
    mimeType: 'application/pdf',
  }).create()
  const key = pdfExportKey(employee.organizationId, pdfExport.id)
  await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
  pdfExport.filePath = key
  await pdfExport.save()
  return pdfExport
}

/** Expert A, expert B et un particulier payé assigné à B. */
async function setup() {
  const expertA = await createInHouseExpert()
  const expertB = await createInHouseExpert()
  const { employee } = await createB2cCandidate({ paid: true, expert: expertB })
  return { expertA, expertB, employee }
}

test.group('Équipe plateforme — ressources d’un particulier non assigné (#167)', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('documents : liste, téléchargement, dépôt et suppression → 404', async ({
    client,
    assert,
  }) => {
    const { expertA, employee } = await setup()
    const document = await documentOf(employee)

    const list = await client
      .get(`/dashboard/conseiller/employees/${employee.id}/profile`)
      .loginAs(expertA)
      .withInertia()
      .redirects(0)
    list.assertStatus(404)

    const download = await client
      .get(`${documentsUrl(employee.id)}/${document.id}`)
      .loginAs(expertA)
      .redirects(0)
    download.assertStatus(404)

    const upload = await client
      .post(documentsUrl(employee.id))
      .file('document', PDF_BYTES, { filename: 'intrus.pdf' })
      .field('kind', 'other')
      .loginAs(expertA)
      .withInertia()
      .redirects(0)
    upload.assertStatus(404)

    const destroy = await client
      .delete(`${documentsUrl(employee.id)}/${document.id}`)
      .loginAs(expertA)
      .withInertia()
      .redirects(0)
    destroy.assertStatus(404)

    const remaining = await documentsOf(employee)
    assert.deepEqual(
      remaining.map((d) => d.id),
      [document.id],
      'ni dépôt ni suppression'
    )
    assert.deepEqual(cloud.downloaded, [])
  })

  test('documents : l’expert assigné garde l’accès', async ({ client, assert }) => {
    const { expertB, employee } = await setup()
    const referer = `/dashboard/conseiller/employees/${employee.id}/profile`

    const upload = await client
      .post(documentsUrl(employee.id))
      .file('document', PDF_BYTES, { filename: 'compte-rendu.pdf' })
      .field('kind', 'other')
      .loginAs(expertB)
      .withInertia()
      .header('referer', referer)
      .redirects(0)
    upload.assertStatus(302)
    const [document] = await documentsOf(employee)
    assert.isTrue(cloud.has(document.cloudinaryPublicId))

    const list = await client.get(referer).loginAs(expertB).withInertia().redirects(0)
    list.assertStatus(200)

    const download = await client
      .get(`${documentsUrl(employee.id)}/${document.id}`)
      .loginAs(expertB)
    download.assertStatus(200)

    const destroy = await client
      .delete(`${documentsUrl(employee.id)}/${document.id}`)
      .loginAs(expertB)
      .withInertia()
      .header('referer', referer)
      .redirects(0)
    destroy.assertStatus(303)
    assert.lengthOf(await documentsOf(employee), 0)
  })

  test('export PDF : téléchargement → 404 pour l’expert non assigné, 200 pour l’assigné', async ({
    client,
  }) => {
    const { expertA, expertB, employee } = await setup()
    const pdfExport = await completedExportOf(employee, expertB)

    const foreign = await client.get(pdfUrl(pdfExport.id)).loginAs(expertA).redirects(0)
    foreign.assertStatus(404)

    const own = await client.get(pdfUrl(pdfExport.id)).loginAs(expertB).redirects(0)
    own.assertStatus(200)
  })

  test('note : création → 404 pour l’expert non assigné, OK pour l’assigné', async ({
    client,
    assert,
  }) => {
    const { expertA, expertB, employee } = await setup()
    const referer = `/dashboard/conseiller/employees/${employee.id}`

    // Hors Inertia : l'erreur de domaine répond avec son statut (en Inertia,
    // flash + redirect back, comme les autres erreurs métier).
    const foreign = await client
      .post(notesUrl(employee.id))
      .json({ content: 'Intrusion', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(expertA)
      .redirects(0)
    foreign.assertStatus(404)
    assert.isNull(await Note.query().where('employeeId', employee.id).first())

    const own = await client
      .post(notesUrl(employee.id))
      .header('referer', referer)
      .form({ content: 'Bon entretien', visibility: NOTE_VISIBILITY.SHARED })
      .loginAs(expertB)
      .withInertia()
      .redirects(0)
    own.assertStatus(302)
    const note = await Note.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(note.authorId, expertB.id)
  })
})
