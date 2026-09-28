import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import type User from '#models/user'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import {
  createAdvisor,
  createCandidate,
  createEmployeeFor,
  createOrganization,
  createSuperAdmin,
  createUser,
} from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'

/**
 * Entrée du dashboard (start/routes/dashboard/index.ts) : aiguillage par rôle
 * et téléchargement des exports PDF.
 */
test.group('Dashboard — GET /dashboard aiguille selon le rôle (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('sans session : redirige vers /auth/login', async ({ client }) => {
    const response = await client.get('/dashboard').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })

  test('sans session (JSON) : 401', async ({ client }) => {
    const response = await client.get('/dashboard').header('Accept', 'application/json')

    response.assertStatus(401)
  })

  const targets: Array<[UserRole, string]> = [
    [USERS_ROLES.EMPLOYEE, '/dashboard/candidat'],
    [USERS_ROLES.ADVISOR, '/dashboard/conseiller'],
    [USERS_ROLES.ADMIN, '/dashboard/conseiller'],
    [USERS_ROLES.EXPERT, '/dashboard/conseiller'],
    [USERS_ROLES.SUPER_ADMIN, '/dashboard/super-admin'],
  ]

  for (const [role, target] of targets) {
    test(`rôle ${role} : redirige vers ${target}`, async ({ client }) => {
      const user = await createUser(role)

      const response = await client.get('/dashboard').loginAs(user).redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', target)
    })
  }
})

test.group('Dashboard — GET /dashboard/pdf-exports/:id/download (functional)', (group) => {
  const filePath = pdfExportKey(1, 424_242)

  group.each.setup(() => truncateDb())
  group.each.setup(async () => {
    swapFakeCloudinary()
    await storePdf(filePath, new TextEncoder().encode('%PDF-1.4 contenu de test'))
    return () => restoreCloudinary()
  })

  /** Export d'un candidat suivi par `advisor`, fichier présent dans le stockage. */
  async function exportFor(
    advisor: User,
    overrides: { status?: PdfExportStatus; filePath?: string | null; userId?: number } = {}
  ) {
    const employee = await createEmployeeFor(advisor)
    return PdfExportFactory.merge({
      userId: overrides.userId ?? advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      advisorUserId: advisor.id,
      status: overrides.status ?? PDF_EXPORT_STATUSES.COMPLETED,
      filePath: overrides.filePath === undefined ? filePath : overrides.filePath,
      fileName: 'synthese-candidat.pdf',
      mimeType: 'application/pdf',
    }).create()
  }

  test('sans session : redirige vers /auth/login', async ({ client }) => {
    const response = await client.get('/dashboard/pdf-exports/1/download').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })

  test('conseiller de la même organisation : télécharge le fichier en pièce jointe', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const pdfExport = await exportFor(advisor)

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(advisor)

    response.assertStatus(200)
    assert.include(response.header('content-disposition'), 'attachment')
    assert.include(response.header('content-disposition'), 'synthese-candidat.pdf')
    assert.include(response.header('content-type'), 'application/pdf')
    assert.equal(Buffer.from(response.body()).toString(), '%PDF-1.4 contenu de test')
  })

  /** #63 : 404, jamais 403 — la réponse ne confirme pas l'existence de l'export. */
  test('conseiller d’une autre organisation : 404', async ({ client }) => {
    const owner = await createAdvisor()
    const pdfExport = await exportFor(owner)
    const outsider = await createAdvisor(await createOrganization())

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(outsider)

    response.assertStatus(404)
  })

  test('super admin : télécharge l’export de n’importe quelle organisation', async ({ client }) => {
    const advisor = await createAdvisor()
    const pdfExport = await exportFor(advisor)
    const superAdmin = await createSuperAdmin(await createOrganization())

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(superAdmin)

    response.assertStatus(200)
  })

  test('candidat : télécharge l’export de sa propre fiche', async ({ client }) => {
    const organization = await createOrganization()
    const advisor = await createAdvisor(organization)
    const { user, employee } = await createCandidate({ organization, advisor })
    const pdfExport = await PdfExportFactory.merge({
      userId: advisor.id,
      organizationId: organization.id,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath,
      fileName: 'ma-synthese.pdf',
    }).create()

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(user)

    response.assertStatus(200)
  })

  test('candidat : 404 sur l’export d’une autre fiche de sa propre organisation', async ({
    client,
  }) => {
    const organization = await createOrganization()
    const advisor = await createAdvisor(organization)
    const pdfExport = await exportFor(advisor)
    const { user } = await createCandidate({ organization, advisor })

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(user)

    response.assertStatus(404)
  })

  test('export non terminé : 409', async ({ client }) => {
    const advisor = await createAdvisor()
    const pdfExport = await exportFor(advisor, { status: PDF_EXPORT_STATUSES.PROCESSING })

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(advisor)

    response.assertStatus(409)
  })

  test('export inexistant : 404', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .get('/dashboard/pdf-exports/999999/download')
      .header('Accept', 'application/json')
      .loginAs(advisor)

    response.assertStatus(404)
  })

  test('export sans chemin de fichier : 404', async ({ client }) => {
    const advisor = await createAdvisor()
    const pdfExport = await exportFor(advisor, { filePath: null })

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(advisor)

    response.assertStatus(404)
  })

  test('fichier absent du stockage : 404', async ({ client }) => {
    const advisor = await createAdvisor()
    const pdfExport = await exportFor(advisor, { filePath: pdfExportKey(1, 999_999) })

    const response = await client
      .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
      .loginAs(advisor)

    response.assertStatus(404)
  })
})
