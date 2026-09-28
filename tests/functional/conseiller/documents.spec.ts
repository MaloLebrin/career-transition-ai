import { MediaFactory } from '#database/factories/media_factory'
import Organization from '#models/organization'
import { createAdvisor, createCandidate, createEmployeeFor } from '#tests/support/actors'
import { PDF_BYTES, documentsOf } from '#tests/support/documents'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Documents du candidat, côté conseiller (issue #50) :
 * `POST /dashboard/conseiller/employees/:id/documents`, `GET|DELETE …/:mediaId`,
 * liste dans `GET /dashboard/conseiller/employees/:id/profile`.
 */
const base = (employeeId: number) => `/dashboard/conseiller/employees/${employeeId}/documents`

test.group('Conseiller — documents du candidat', (group) => {
  let cloud: FakeCloudinary

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('dépose un document sur la fiche d’un candidat de son cabinet', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)

    const response = await client
      .post(base(employee.id))
      .file('document', PDF_BYTES, { filename: 'compte-rendu.pdf' })
      .field('kind', 'other')
      .loginAs(advisor)
      .withInertia()
      .header('referer', `/dashboard/conseiller/employees/${employee.id}/profile`)
      .redirects(0)

    response.assertStatus(302)
    const [document] = await documentsOf(employee)
    assert.equal(document.uploadedById, advisor.id)
    assert.isTrue(cloud.has(document.cloudinaryPublicId))
  })

  test('voit les documents du candidat et peut tous les supprimer', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const { user, employee } = await createCandidate({ organization: org, advisor })
    await client
      .post('/dashboard/candidat/documents')
      .file('document', PDF_BYTES, { filename: 'cv-candidat.pdf' })
      .field('kind', 'cv')
      .loginAs(user)

    const page = await client
      .get(`/dashboard/conseiller/employees/${employee.id}/profile`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, page, 'dashboard/employee/profile/Home', [
      'documents',
      'documentsBaseUrl',
    ])
    assert.equal(props.documentsBaseUrl, base(employee.id))
    const [listed] = props.documents as Array<{ id: number; canDelete: boolean }>
    assert.isTrue(listed.canDelete, 'le conseiller supprime aussi les dépôts du candidat')

    const download = await client.get(`${base(employee.id)}/${listed.id}`).loginAs(advisor)
    download.assertStatus(200)

    await client
      .delete(`${base(employee.id)}/${listed.id}`)
      .loginAs(advisor)
      .redirects(0)
    assert.lengthOf(await documentsOf(employee), 0)
    assert.lengthOf(cloud.destroyed, 1)
  })

  test('candidat d’une autre organisation : 404 sur toutes les routes', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const otherAdvisor = await createAdvisor()
    const foreign = await createEmployeeFor(otherAdvisor)
    const document = await MediaFactory.merge({
      entityId: foreign.id,
      organizationId: foreign.organizationId,
    }).create()

    const upload = await client
      .post(base(foreign.id))
      .file('document', PDF_BYTES, { filename: 'intrus.pdf' })
      .field('kind', 'other')
      .loginAs(advisor)
    upload.assertStatus(404)

    const download = await client.get(`${base(foreign.id)}/${document.id}`).loginAs(advisor)
    download.assertStatus(404)

    const removal = await client.delete(`${base(foreign.id)}/${document.id}`).loginAs(advisor)
    removal.assertStatus(404)

    assert.lengthOf(await documentsOf(foreign), 1)
    assert.deepEqual(cloud.uploaded, [])
    assert.deepEqual(cloud.destroyed, [])
  })

  test('document d’un autre candidat du cabinet via la mauvaise fiche : 404', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const first = await createEmployeeFor(advisor)
    const second = await createEmployeeFor(advisor)
    const document = await MediaFactory.merge({
      entityId: second.id,
      organizationId: second.organizationId,
    }).create()

    const response = await client.get(`${base(first.id)}/${document.id}`).loginAs(advisor)

    response.assertStatus(404)
    assert.deepEqual(cloud.downloaded, [])
  })

  test('un candidat n’accède pas aux routes conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const { user } = await createCandidate()

    const response = await client
      .get(`${base(employee.id)}/1`)
      .loginAs(user)
      .redirects(0)

    response.assertStatus(403)
  })
})
