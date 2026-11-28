import Employee from '#models/employee'
import EmployeeSynthesis from '#models/employee_synthesis'
import Organization from '#models/organization'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import GenerateEmployeeSynthesisPdf, {
  RESULTS_LOCKED_MESSAGE,
} from '#jobs/generate_employee_synthesis_pdf'
import { createB2cCandidate } from '#tests/support/actors'
import { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { pdfExportKey } from '#services/pdf_storage_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { TRANSMIT_PG_CHANNEL } from '#shared/constants/runtime_stores'
import { MemoryTransport } from '@boringnode/bus/transports/memory'
import { test } from '@japa/runner'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function seedFullScenario(prefix: string) {
  const ts = Date.now()
  const org = await Organization.create({
    name: `${prefix} Org`,
    slug: `${prefix}-${ts}`,
    logoUrl: null,
  })
  const advisor = await User.create({
    organizationId: org.id,
    email: `${prefix}-advisor-${ts}@example.com`,
    password: 'secretsecret',
    name: 'Advisor',
    role: USERS_ROLES.ADVISOR as any,
  })
  const empUser = await User.create({
    organizationId: org.id,
    email: `${prefix}-emp-${ts}@example.com`,
    password: 'secretsecret',
    name: 'Emp',
    role: USERS_ROLES.EMPLOYEE as any,
  })
  const employee = await Employee.create({
    organizationId: org.id,
    advisorId: advisor.id,
    userId: empUser.id,
    name: 'PDF User',
    email: `${prefix}-pdfuser-${ts}@example.com`,
    currentRole: 'Dev',
    targetRole: null,
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
  })
  await EmployeeSynthesis.create({
    organizationId: org.id,
    employeeId: employee.id,
    shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    sharedAt: null,
    sharedByUserId: advisor.id,
    expertCommentsShared: 'Tout va bien',
    expertNotesInternal: 'Notes internes',
    executiveSummaryOverride: null,
  })
  return { org, advisor, empUser, employee }
}

async function createPendingExport(
  userId: number,
  orgId: number,
  employeeId: number,
  advisorUserId: number | null = null
) {
  return PdfExport.create({
    userId,
    organizationId: orgId,
    employeeId,
    advisorUserId,
    status: PDF_EXPORT_STATUSES.PENDING,
  })
}

// ─── succes ───────────────────────────────────────────────────────────────────

test.group('GenerateEmployeeSynthesisPdf job — succes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('passe en COMPLETED avec filePath et fileName definis', async ({ assert }) => {
    const { org, advisor, employee } = await seedFullScenario('job-ok')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const updated = await PdfExport.findOrFail(pdfExport.id)
    if (updated.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      assert.fail(
        `Statut inattendu : ${updated.status} — erreur : ${updated.errorMessage ?? 'n/a'}`
      )
    }
    assert.equal(updated.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.isString(updated.filePath)
    assert.isNotEmpty(updated.filePath)
    assert.isString(updated.fileName)
    assert.isNotEmpty(updated.fileName)
    assert.isNotNull(updated.startedAt)
    assert.isNotNull(updated.finishedAt)
    assert.isNull(updated.errorMessage)
  })

  test('écrit le PDF privé sur Cloudinary sous un public_id sans nom (issue #49)', async ({
    assert,
  }) => {
    const cloud = swapFakeCloudinary()
    const { org, advisor, employee } = await seedFullScenario('job-storage')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const updated = await PdfExport.findOrFail(pdfExport.id)
    assert.equal(updated.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.equal(updated.filePath, pdfExportKey(org.id, pdfExport.id))
    assert.notInclude(updated.filePath!, employee.name)
    assert.deepEqual(cloud.uploaded, [
      { publicId: updated.filePath!, resourceType: 'raw', deliveryType: 'authenticated' },
    ])
    const bytes = cloud.files.get(updated.filePath!)!.bytes
    assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-')
    assert.equal(updated.size, bytes.byteLength)
  })

  test('supporte les caracteres non WinAnsi (ex: fleche) via sanitation', async ({ assert }) => {
    const { org, advisor, employee } = await seedFullScenario('job-unicode')
    employee.targetRole = 'Lead Developer / Formateur tech'
    await employee.save()
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const updated = await PdfExport.findOrFail(pdfExport.id)
    if (updated.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      assert.fail(
        `Statut inattendu : ${updated.status} — erreur : ${updated.errorMessage ?? 'n/a'}`
      )
    }
    assert.equal(updated.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.isString(updated.filePath)
    assert.isNotEmpty(updated.filePath)
  })

  test('le nom du fichier contient le nom de employe', async ({ assert }) => {
    const { org, advisor, employee } = await seedFullScenario('job-filename')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const updated = await PdfExport.findOrFail(pdfExport.id)
    if (updated.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      assert.fail(`Statut inattendu : ${updated.status}`)
    }
    assert.include(updated.fileName!, 'PDF_User')
    assert.include(updated.fileName!, '.pdf')
  })
})

// ─── transitions d'etat ───────────────────────────────────────────────────────

test.group('GenerateEmployeeSynthesisPdf job — transitions detat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('startedAt et finishedAt sont definis apres execution', async ({ assert }) => {
    const { org, advisor, employee } = await seedFullScenario('job-dates')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    const before = new Date()
    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const updated = await PdfExport.findOrFail(pdfExport.id)
    if (updated.status !== PDF_EXPORT_STATUSES.COMPLETED) {
      assert.fail(`Statut inattendu : ${updated.status}`)
    }
    const startedAt = updated.startedAt?.toJSDate()
    const finishedAt = updated.finishedAt?.toJSDate()

    assert.isNotNull(startedAt)
    assert.isNotNull(finishedAt)
    assert.isAtLeast(startedAt!.getTime(), before.getTime() - 5000)
    assert.isAtLeast(finishedAt!.getTime(), startedAt!.getTime())
  })
})

// ─── echec ────────────────────────────────────────────────────────────────────

test.group('GenerateEmployeeSynthesisPdf job — echec', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('passe en FAILED avec errorMessage quand le service PDF echoue', async ({ assert }) => {
    const { org, advisor, employee } = await seedFullScenario('job-fail')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    // Monkey-patch natif sans dependance externe
    const original = EmployeeSynthesisService.prototype.buildForCandidate
    EmployeeSynthesisService.prototype.buildForCandidate = async () => {
      throw new Error('Service PDF indisponible')
    }

    try {
      await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')
    } catch {
      // relance attendue
    } finally {
      EmployeeSynthesisService.prototype.buildForCandidate = original
    }

    const updated = await PdfExport.findOrFail(pdfExport.id)
    assert.equal(updated.status, PDF_EXPORT_STATUSES.FAILED)
    assert.include(updated.errorMessage!, 'Service PDF indisponible')
    assert.isNotNull(updated.finishedAt)
  })
})

// ─── forfait des particuliers (#101) ──────────────────────────────────────────

test.group('GenerateEmployeeSynthesisPdf job — droit disparu (#101)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('B2C sans forfait : FAILED avec un motif explicite, aucun PDF, pas de relance', async ({
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()
    const pdfExport = await createPendingExport(user.id, employee.organizationId, employee.id)

    await assert.doesNotReject(() =>
      GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')
    )

    await pdfExport.refresh()
    assert.equal(pdfExport.status, PDF_EXPORT_STATUSES.FAILED)
    assert.equal(pdfExport.errorMessage, RESULTS_LOCKED_MESSAGE)
    assert.isNull(pdfExport.filePath)
    assert.isNotNull(pdfExport.finishedAt)
  })

  test('B2C payé : PDF généré comme pour un B2B', async ({ assert }) => {
    const { user, employee } = await createB2cCandidate({ paid: true })
    const pdfExport = await createPendingExport(user.id, employee.organizationId, employee.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    await pdfExport.refresh()
    assert.equal(pdfExport.status, PDF_EXPORT_STATUSES.COMPLETED)
    assert.isNotNull(pdfExport.filePath)
  })
})

// ─── relais worker → web (#172) ───────────────────────────────────────────────

test.group('GenerateEmployeeSynthesisPdf job — relais des diffusions vers le web', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  /**
   * Le job tourne ici, hors de tout process HTTP, comme dans le worker. Le
   * « process web » est un second abonné du bus de Transmit (`memory` en
   * test, `postgres` en production) : il ne reçoit le message que si la
   * diffusion du job passe par le transport — avec `transport: null`, rien.
   */
  test('« PDF prêt » et la notification atteignent un abonné d’un autre process', async ({
    assert,
    cleanup,
  }) => {
    const web = new MemoryTransport().setId('web-process')
    const received: Array<{ channel: string; payload: any }> = []
    await web.subscribe(TRANSMIT_PG_CHANNEL, (message: any) => {
      received.push({ channel: message.channel, payload: message.payload })
    })
    cleanup(() => web.unsubscribe(TRANSMIT_PG_CHANNEL))

    const { org, advisor, employee } = await seedFullScenario('job-relay')
    const pdfExport = await createPendingExport(advisor.id, org.id, employee.id, advisor.id)

    await GenerateEmployeeSynthesisPdf.dispatch({ pdfExportId: pdfExport.id }).toQueue('pdfs')

    const exportEvents = received.filter((m) => m.channel === `users/${advisor.id}/pdf-exports`)
    assert.deepEqual(
      exportEvents.map((m) => m.payload.status),
      [PDF_EXPORT_STATUSES.PROCESSING, PDF_EXPORT_STATUSES.COMPLETED]
    )
    assert.isTrue(
      received.some((m) => m.channel === `organizations/${org.id}/pdf-exports`),
      'canal d’organisation relayé'
    )
    const notification = received.find((m) => m.channel === `users/${advisor.id}/notifications`)
    assert.exists(notification, 'notification « export PDF prêt » relayée')
  })
})
