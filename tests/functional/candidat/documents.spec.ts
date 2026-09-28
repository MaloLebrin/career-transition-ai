import { MediaFactory } from '#database/factories/media_factory'
import { MAX_CANDIDATE_DOCUMENTS } from '#shared/constants/media'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { PDF_BYTES, documentsOf } from '#tests/support/documents'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Documents du candidat, côté candidat (issue #50) :
 * `POST /dashboard/candidat/documents`, `GET|DELETE …/documents/:mediaId`,
 * liste dans `GET /dashboard/candidat/profile`.
 */
const BASE = '/dashboard/candidat/documents'
const PROFILE = '/dashboard/candidat/profile'

test.group('Candidat — documents', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('dépose un document privé, sans nom de candidat dans Cloudinary', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    const response = await client
      .post(BASE)
      .file('document', PDF_BYTES, { filename: 'Mon CV Élodie.pdf' })
      .field('kind', 'cv')
      .loginAs(user)
      .withInertia()
      .header('referer', PROFILE)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.equal(response.flashMessage('success'), 'Document ajouté.')

    const [document] = await documentsOf(employee)
    assert.equal(document.kind, 'cv')
    assert.equal(document.originalFilename, 'Mon CV Élodie.pdf')
    assert.equal(document.uploadedById, user.id)
    assert.equal(document.organizationId, employee.organizationId)
    assert.match(
      document.cloudinaryPublicId,
      new RegExp(
        `^career-transition/dev/organizations/${employee.organizationId}/employees/${employee.id}/documents/doc_[0-9a-f-]{36}\\.pdf$`
      )
    )
    assert.deepEqual(cloud.uploaded, [
      { publicId: document.cloudinaryPublicId, resourceType: 'raw', deliveryType: 'authenticated' },
    ])
  })

  test('liste ses documents sur son profil', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await client
      .post(BASE)
      .file('document', PDF_BYTES, { filename: 'diplome.pdf' })
      .field('kind', 'diploma')
      .loginAs(user)

    const response = await client.get(PROFILE).loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/profile/Home', [
      'documents',
      'documentsBaseUrl',
    ])
    assert.equal(props.documentsBaseUrl, BASE)
    const documents = props.documents as Array<Record<string, unknown>>
    assert.lengthOf(documents, 1)
    assert.include(documents[0], {
      kind: 'diploma',
      originalFilename: 'diplome.pdf',
      canDelete: true,
      uploadedByName: user.name,
    })
    assert.notProperty(documents[0], 'cloudinaryPublicId')
    assert.lengthOf(await documentsOf(employee), 1)
  })

  test('télécharge un document via le serveur (Content-Disposition UTF-8)', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await client
      .post(BASE)
      .file('document', PDF_BYTES, { filename: 'Attestation été.pdf' })
      .field('kind', 'certificate')
      .loginAs(user)
    const [document] = await documentsOf(employee)

    const response = await client.get(`${BASE}/${document.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertHeader('content-type', 'application/pdf')
    assert.include(
      response.header('content-disposition'),
      "filename*=UTF-8''Attestation%20%C3%A9t%C3%A9.pdf"
    )
    assert.equal(Buffer.from(response.body()).toString(), PDF_BYTES.toString())
    assert.deepEqual(
      cloud.downloaded.map((asset) => asset.publicId),
      [document.cloudinaryPublicId]
    )
  })

  test('supprime son document (ligne et fichier)', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await client
      .post(BASE)
      .file('document', PDF_BYTES, { filename: 'lettre.pdf' })
      .field('kind', 'cover_letter')
      .loginAs(user)
    const [document] = await documentsOf(employee)

    const response = await client
      .delete(`${BASE}/${document.id}`)
      .loginAs(user)
      .withInertia()
      .header('referer', PROFILE)
      .redirects(0)

    response.assertStatus(303)
    assert.equal(response.flashMessage('success'), 'Document supprimé.')
    assert.lengthOf(await documentsOf(employee), 0)
    assert.isFalse(cloud.has(document.cloudinaryPublicId))
  })

  test('ne supprime pas un document déposé par son conseiller', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })
    const document = await MediaFactory.merge({
      entityId: employee.id,
      organizationId: employee.organizationId,
      uploadedById: advisor.id,
    }).create()

    const response = await client
      .delete(`${BASE}/${document.id}`)
      .loginAs(user)
      .withInertia()
      .header('referer', PROFILE)
      .redirects(0)

    response.assertStatus(303) // Inertia : 303 après un DELETE
    assert.equal(
      response.flashMessage('error'),
      'Seul votre conseiller peut supprimer ce document.'
    )
    assert.lengthOf(await documentsOf(employee), 1)
  })

  test('document d’un autre candidat : 404, jamais lu ni supprimé', async ({ client, assert }) => {
    const { user } = await createCandidate()
    const { employee: other } = await createCandidate()
    const document = await MediaFactory.merge({
      entityId: other.id,
      organizationId: other.organizationId,
    }).create()

    const download = await client.get(`${BASE}/${document.id}`).loginAs(user)
    download.assertStatus(404)

    await client.delete(`${BASE}/${document.id}`).loginAs(user).redirects(0)
    assert.lengthOf(await documentsOf(other), 1)
    assert.deepEqual(cloud.downloaded, [])
    assert.deepEqual(cloud.destroyed, [])
  })

  test('refuse un type non autorisé et un type de document inconnu', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()

    const response = await client
      .post(BASE)
      .file('document', Buffer.from('MZ\x90\x00'), { filename: 'virus.exe' })
      .field('kind', 'passport')
      .loginAs(user)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['document', 'kind'])
    assert.lengthOf(await documentsOf(employee), 0)
    assert.deepEqual(cloud.uploaded, [])
  })

  test(`limite de ${MAX_CANDIDATE_DOCUMENTS} documents par candidat`, async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await MediaFactory.merge({
      entityId: employee.id,
      organizationId: employee.organizationId,
    }).createMany(MAX_CANDIDATE_DOCUMENTS)

    const response = await client
      .post(BASE)
      .file('document', PDF_BYTES, { filename: 'en-trop.pdf' })
      .field('kind', 'other')
      .loginAs(user)
      .withInertia()
      .header('referer', PROFILE)
      .redirects(0)

    response.assertStatus(302)
    assert.include(response.flashMessage('error'), `Limite de ${MAX_CANDIDATE_DOCUMENTS} documents`)
    assert.lengthOf(await documentsOf(employee), MAX_CANDIDATE_DOCUMENTS)
    assert.deepEqual(cloud.uploaded, [])
  })

  test('un conseiller n’accède pas aux routes candidat (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.post(BASE).field('kind', 'cv').loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })
})
