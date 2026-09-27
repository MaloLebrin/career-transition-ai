import PdfExportDownloadsController from '#controllers/pdf_export_downloads_controller'
import Employee from '#models/employee'
import Organization from '#models/organization'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import type { Readable } from 'node:stream'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<any> = {}) {
  return {
    auth: { user: null },
    params: {},
    request: {},
    response: {
      unauthorized: () => ({ status: 401 }),
      forbidden: () => ({ status: 403 }),
      badRequest: (_msg?: string) => ({ status: 400 }),
      notFound: () => ({ status: 404 }),
      header: () => {},
      // Consomme le flux avant que le disque factice soit nettoyé.
      stream: async (stream: Readable) => {
        await drain(stream)
        return { status: 200 }
      },
      attachment: (_path: string, _name?: string) => ({ status: 200 }),
    },
    ...overrides,
  }
}

let pdfCounter = 0

async function drain(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

/** PDF déposé sur le disque Drive factice ; renvoie sa clé. */
async function createFakePdfFile(): Promise<string> {
  const key = pdfExportKey(1_000_000 + ++pdfCounter)
  await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
  return key
}

async function seedOrg(prefix: string) {
  const ts = Date.now()
  return Organization.create({ name: `${prefix} Org`, slug: `${prefix}-${ts}`, logoUrl: null })
}

async function seedUser(org: Organization, role: string, prefix: string) {
  const ts = Date.now()
  return User.create({
    organizationId: org.id,
    email: `${prefix}-${ts}@example.com`,
    password: 'secretsecret',
    name: prefix,
    role: role as any,
  })
}

async function seedEmployee(org: Organization, user: User, prefix: string) {
  const ts = Date.now()
  return Employee.create({
    organizationId: org.id,
    advisorId: null,
    userId: user.id,
    name: `${prefix} Emp`,
    email: `${prefix}-emp-${ts}@example.com`,
    currentRole: 'Dev',
    targetRole: null,
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
  })
}

async function seedCompletedExport(
  userId: number,
  orgId: number,
  employeeId: number,
  filePath: string
) {
  return PdfExport.create({
    userId,
    organizationId: orgId,
    employeeId,
    advisorUserId: null,
    status: PDF_EXPORT_STATUSES.COMPLETED,
    filePath,
    fileName: 'Synthese.pdf',
    mimeType: 'application/pdf',
    size: 13,
  })
}

// ─── tests : non authentifié ──────────────────────────────────────────────────

test.group('PdfExportDownloadsController.show — acces non authentifie', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('retourne 401 si aucun utilisateur authentifie', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-unauth')
    const user = await seedUser(org, USERS_ROLES.EMPLOYEE, 'cand')
    const emp = await seedEmployee(org, user, 'cand')
    const filePath = await createFakePdfFile()
    const pdfExport = await seedCompletedExport(user.id, org.id, emp.id, filePath)

    const ctx = makeCtx({ auth: { user: null }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 401)
  })
})

// ─── tests : export non complété ─────────────────────────────────────────────

test.group('PdfExportDownloadsController.show — export non complete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('retourne 400 si le statut est pending', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-pending')
    const user = await seedUser(org, USERS_ROLES.ADMIN, 'admin')
    const emp = await seedEmployee(org, user, 'admin')

    const pdfExport = await PdfExport.create({
      userId: user.id,
      organizationId: org.id,
      employeeId: emp.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.PENDING,
    })

    const ctx = makeCtx({ auth: { user }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 400)
  })

  test('retourne 400 si le statut est failed', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-failed')
    const user = await seedUser(org, USERS_ROLES.ADMIN, 'admin')
    const emp = await seedEmployee(org, user, 'admin')

    const pdfExport = await PdfExport.create({
      userId: user.id,
      organizationId: org.id,
      employeeId: emp.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.FAILED,
      errorMessage: 'boom',
    })

    const ctx = makeCtx({ auth: { user }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 400)
  })
})

// ─── tests : contrôle admin ───────────────────────────────────────────────────

test.group('PdfExportDownloadsController.show — acces admin', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('admin de la meme orga peut telecharger', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-admin-ok')
    const adminUser = await seedUser(org, USERS_ROLES.ADMIN, 'admin')
    const candidateUser = await seedUser(org, USERS_ROLES.EMPLOYEE, 'cand')
    const emp = await seedEmployee(org, candidateUser, 'cand')
    const filePath = await createFakePdfFile()
    const pdfExport = await seedCompletedExport(candidateUser.id, org.id, emp.id, filePath)

    const ctx = makeCtx({ auth: { user: adminUser }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 200)
  })

  test('admin dune autre orga obtient 403', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const orgA = await seedOrg('dl-admin-403-a')
    const orgB = await seedOrg('dl-admin-403-b')
    const adminB = await seedUser(orgB, USERS_ROLES.ADMIN, 'adminB')
    const candidateA = await seedUser(orgA, USERS_ROLES.EMPLOYEE, 'candA')
    const empA = await seedEmployee(orgA, candidateA, 'candA')
    const filePath = await createFakePdfFile()
    const pdfExport = await seedCompletedExport(candidateA.id, orgA.id, empA.id, filePath)

    const ctx = makeCtx({ auth: { user: adminB }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 403)
  })
})

// ─── tests : super admin ──────────────────────────────────────────────────────

test.group('PdfExportDownloadsController.show — acces super admin', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('super admin peut telecharger nimporte quel export', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const orgA = await seedOrg('dl-sa')
    const platformOrg = await seedOrg('dl-sa-platform')
    const superAdmin = await seedUser(platformOrg, USERS_ROLES.SUPER_ADMIN, 'superadmin')
    const candidateA = await seedUser(orgA, USERS_ROLES.EMPLOYEE, 'candA')
    const empA = await seedEmployee(orgA, candidateA, 'candA')
    const filePath = await createFakePdfFile()
    const pdfExport = await seedCompletedExport(candidateA.id, orgA.id, empA.id, filePath)

    const ctx = makeCtx({ auth: { user: superAdmin }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 200)
  })
})

// ─── tests : candidat ────────────────────────────────────────────────────────

test.group('PdfExportDownloadsController.show — acces candidat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('candidat peut telecharger son propre export', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-cand-own')
    const candidateUser = await seedUser(org, USERS_ROLES.EMPLOYEE, 'cand')
    const emp = await seedEmployee(org, candidateUser, 'cand')
    const filePath = await createFakePdfFile()
    const pdfExport = await seedCompletedExport(candidateUser.id, org.id, emp.id, filePath)

    const ctx = makeCtx({ auth: { user: candidateUser }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 200)
  })

  test('export sans filePath retourne 404', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const org = await seedOrg('dl-no-path')
    const adminUser = await seedUser(org, USERS_ROLES.ADMIN, 'admin')
    const emp = await seedEmployee(org, adminUser, 'admin')

    const pdfExport = await PdfExport.create({
      userId: adminUser.id,
      organizationId: org.id,
      employeeId: emp.id,
      advisorUserId: null,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      fileName: 'Synthese.pdf',
      mimeType: 'application/pdf',
    })

    const ctx = makeCtx({ auth: { user: adminUser }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 404)
  })
})

// ─── tests : lecture depuis le stockage Drive (issue #21) ─────────────────────

test.group('PdfExportDownloadsController.show — stockage', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  async function adminWithExport(prefix: string, filePath: string) {
    const org = await seedOrg(prefix)
    const adminUser = await seedUser(org, USERS_ROLES.ADMIN, 'admin')
    const emp = await seedEmployee(org, adminUser, 'admin')
    const pdfExport = await seedCompletedExport(adminUser.id, org.id, emp.id, filePath)
    return { adminUser, pdfExport }
  }

  test('diffuse le PDF avec type et nom de fichier', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const { adminUser, pdfExport } = await adminWithExport('dl-stream', await createFakePdfFile())
    pdfExport.fileName = 'Synthèse_Élise.pdf'
    await pdfExport.save()

    const headers: Record<string, string> = {}
    let body = ''
    const ctx = makeCtx({ auth: { user: adminUser }, params: { id: String(pdfExport.id) } })
    ctx.response.header = (name: string, value: string) => {
      headers[name] = value
    }
    ctx.response.stream = async (stream: Readable) => {
      body = await drain(stream)
      return { status: 200 }
    }

    const result = await controller.show(ctx as any)

    assert.equal(result.status, 200)
    assert.equal(body, '%PDF-1.4 fake')
    assert.equal(headers['Content-Type'], 'application/pdf')
    assert.include(headers['Content-Disposition'], 'filename="Synthese_Elise.pdf"')
    assert.include(headers['Content-Disposition'], "filename*=UTF-8''Synth%C3%A8se_%C3%89lise.pdf")
  })

  test('clé absente du stockage : 404', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const { adminUser, pdfExport } = await adminWithExport('dl-missing', pdfExportKey(987_654))

    const ctx = makeCtx({ auth: { user: adminUser }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 404)
  })

  test('ancien chemin absolu : 404, jamais lu hors du préfixe', async ({ assert }) => {
    const controller = new PdfExportDownloadsController()
    const { adminUser, pdfExport } = await adminWithExport('dl-legacy', '/etc/passwd')

    const ctx = makeCtx({ auth: { user: adminUser }, params: { id: String(pdfExport.id) } })
    const result = await controller.show(ctx as any)
    assert.equal(result.status, 404)
  })
})
