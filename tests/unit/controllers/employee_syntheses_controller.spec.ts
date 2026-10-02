import { makeEntitlements } from '#tests/support/entitlements'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { DateTime } from 'luxon'
import EmployeeSynthesesController from '#controllers/employee_syntheses_controller'
import type Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import type User from '#models/user'
import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EntitlementsService } from '#services/entitlements_service'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createAdvisor, createCandidate, createEmployeeFor } from '#tests/support/actors'

/**
 * Unit — `EmployeeSynthesesController` (vues et mutations conseiller / candidat).
 * `EmployeeSynthesisService` est remplacé par un faux injecté au constructeur,
 * qui délègue au vrai service les lectures migrées depuis le contrôleur (#101) ;
 * les vues conseiller interrogent encore `Employee` elles-mêmes (dette figée dans
 * `controllers_thin.spec.ts`), d'où la base isolée par une transaction globale.
 *
 * La génération PDF (`generateShareablePdf*`) est couverte par
 * `employee_syntheses_generate_pdf.spec.ts`.
 */

const ADVISOR_PAYLOAD = {
  employee: { id: 0, name: 'Payload' },
  synthesis: {
    shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
    sharedAt: null,
    expertCommentsShared: null,
    expertNotesInternal: 'interne',
    executiveSummaryOverride: null,
  },
  latestCompletedByType: { values: 12 },
}

const CANDIDATE_PAYLOAD = {
  employee: { id: 0, name: 'Payload candidat' },
  synthesis: {
    shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
    sharedAt: '2026-09-01T00:00:00.000Z',
    expertCommentsShared: 'partagé',
    executiveSummaryOverride: null,
  },
  latestCompletedByType: { disc: 4 },
}

type ScopeInput = { organizationId: number; employeeId: number }

class FakeSynthesisService {
  public buildForAdvisorCalls: ScopeInput[] = []
  public buildForCandidateCalls: ScopeInput[] = []
  public getOrCreateRowCalls: ScopeInput[] = []
  public buildError: Error | null = null
  private real = new EmployeeSynthesisService()

  async buildForAdvisor(input: ScopeInput) {
    this.buildForAdvisorCalls.push(input)
    if (this.buildError) throw this.buildError
    return ADVISOR_PAYLOAD
  }

  async buildForCandidate(input: ScopeInput) {
    this.buildForCandidateCalls.push(input)
    return CANDIDATE_PAYLOAD
  }

  /** Délègue au vrai service : la ligne créée/relue est ce que le contrôleur modifie. */
  async getOrCreateRow(input: ScopeInput) {
    this.getOrCreateRowCalls.push(input)
    return this.real.getOrCreateRow(input)
  }

  // Lectures migrées depuis le contrôleur (#101) : déléguées au vrai service.
  getCandidateEmployee(user: User) {
    return this.real.getCandidateEmployee(user)
  }

  findRow(input: ScopeInput) {
    return this.real.findRow(input)
  }

  candidateCanView(...args: Parameters<EmployeeSynthesisService['candidateCanView']>) {
    return this.real.candidateCanView(...args)
  }

  findLatestPdfExport(...args: Parameters<EmployeeSynthesisService['findLatestPdfExport']>) {
    return this.real.findLatestPdfExport(...args)
  }

  requestPdfExport(...args: Parameters<EmployeeSynthesisService['requestPdfExport']>) {
    return this.real.requestPdfExport(...args)
  }
}

function makeContext(
  user: User,
  params: Record<string, unknown> = {},
  inputs: Record<string, unknown> = {}
) {
  const flashes: Array<[string, string]> = []
  const state = { redirectedBack: false }
  const rendered: Array<{ component: string; props: Record<string, any> }> = []
  const ctx = {
    auth: { user },
    params,
    request: { input: (key: string) => inputs[key] },
    session: {
      flash(key: string, value: string) {
        flashes.push([key, value])
      },
    },
    response: {
      redirect() {
        return {
          back() {
            state.redirectedBack = true
          },
        }
      },
    },
    inertia: {
      render(component: string, props: Record<string, any>) {
        rendered.push({ component, props })
        return { component, props }
      },
    },
  } as any
  return { ctx, flashes, state, rendered }
}

/** Notifications du candidat (#70) enregistrées au lieu d'être envoyées. */
class FakeCandidateNotifications {
  public synthesisSharedFor: number[] = []

  async synthesisShared(sharedEmployee: Employee) {
    this.synthesisSharedFor.push(sharedEmployee.id)
  }
}

function setup() {
  const service = new FakeSynthesisService()
  const notifications = new FakeCandidateNotifications()
  const controller = new EmployeeSynthesesController(
    service as any,
    notifications as any,
    makeEntitlements()
  )
  return { service, notifications, controller }
}

async function expectRowNotFound(assert: any, run: () => Promise<unknown>) {
  try {
    await run()
    assert.fail('aurait dû lever E_ROW_NOT_FOUND')
  } catch (error) {
    assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
  }
}

let advisor: User
let employee: Employee

async function seedAdvisor() {
  advisor = await createAdvisor()
  employee = await createEmployeeFor(advisor)
}

test.group('EmployeeSynthesesController.showAdvisor', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seedAdvisor)

  test('rend la synthèse conseiller, sans export PDF', async ({ assert }) => {
    const { service, controller } = setup()
    const { ctx, rendered } = makeContext(advisor, { id: String(employee.id) })

    await controller.showAdvisor(ctx)

    assert.deepEqual(service.buildForAdvisorCalls, [
      { organizationId: advisor.organizationId, employeeId: employee.id },
    ])
    assert.deepEqual(rendered, [
      {
        component: 'dashboard/conseiller/employees/Synthesis',
        props: {
          employeeId: String(employee.id),
          employee: ADVISOR_PAYLOAD.employee,
          synthesis: ADVISOR_PAYLOAD.synthesis,
          latestCompletedByType: ADVISOR_PAYLOAD.latestCompletedByType,
          latestPdfJob: null,
        },
      },
    ])
  })

  test('expose le dernier export du candidat avec son lien de téléchargement', async ({
    assert,
  }) => {
    const base = {
      userId: advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
    }
    await PdfExportFactory.merge({
      ...base,
      status: PDF_EXPORT_STATUSES.FAILED,
      createdAt: DateTime.now().minus({ hours: 2 }),
    }).create()
    const latest = await PdfExportFactory.merge({
      ...base,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'exports/synthesis.pdf',
      createdAt: DateTime.now().minus({ hours: 1 }),
    }).create()
    // Export plus récent d'un autre candidat de l'organisation : ignoré.
    const other = await createEmployeeFor(advisor)
    await PdfExportFactory.merge({ ...base, employeeId: other.id }).create()

    const { controller } = setup()
    const { ctx, rendered } = makeContext(advisor, { id: String(employee.id) })

    await controller.showAdvisor(ctx)

    assert.deepEqual(rendered[0].props.latestPdfJob, {
      id: latest.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      downloadUrl: `/dashboard/pdf-exports/${latest.id}/download`,
    })
  })

  test("pas de lien de téléchargement tant que l'export n'est pas terminé", async ({ assert }) => {
    const pending = await PdfExportFactory.merge({
      userId: advisor.id,
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      status: PDF_EXPORT_STATUSES.PENDING,
    }).create()
    const { controller } = setup()
    const { ctx, rendered } = makeContext(advisor, { id: String(employee.id) })

    await controller.showAdvisor(ctx)

    assert.deepEqual(rendered[0].props.latestPdfJob, {
      id: pending.id,
      status: PDF_EXPORT_STATUSES.PENDING,
      downloadUrl: null,
    })
  })

  test("propage le 404 du service (candidat d'une autre organisation)", async ({ assert }) => {
    const { service, controller } = setup()
    service.buildError = new lucidErrors.E_ROW_NOT_FOUND()
    const { ctx, rendered } = makeContext(await createAdvisor(), { id: String(employee.id) })

    await expectRowNotFound(assert, () => controller.showAdvisor(ctx))
    assert.lengthOf(rendered, 0)
  })
})

test.group('EmployeeSynthesesController.updateAdvisor', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seedAdvisor)

  test('enregistre notes, commentaires et résumé puis redirige', async ({ assert }) => {
    const { service, controller } = setup()
    const { ctx, flashes, state } = makeContext(
      advisor,
      { id: String(employee.id) },
      {
        expertNotesInternal: 'Notes internes',
        expertCommentsShared: 'Commentaires',
        executiveSummaryOverride: 'Résumé',
      }
    )

    await controller.updateAdvisor(ctx)

    assert.deepEqual(service.getOrCreateRowCalls, [
      { organizationId: advisor.organizationId, employeeId: employee.id },
    ])
    const row = await EmployeeSynthesis.findByOrFail('employeeId', employee.id)
    assert.equal(row.expertNotesInternal, 'Notes internes')
    assert.equal(row.expertCommentsShared, 'Commentaires')
    assert.equal(row.executiveSummaryOverride, 'Résumé')
    assert.deepEqual(flashes, [['success', 'Synthèse mise à jour.']])
    assert.isTrue(state.redirectedBack)
  })

  test('un champ absent est remis à null', async ({ assert }) => {
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      expertNotesInternal: 'Ancien',
      executiveSummaryOverride: 'Ancien résumé',
    }).create()
    const { controller } = setup()
    const { ctx } = makeContext(
      advisor,
      { id: String(employee.id) },
      { expertNotesInternal: 'Nouveau' }
    )

    await controller.updateAdvisor(ctx)

    const row = await EmployeeSynthesis.findByOrFail('employeeId', employee.id)
    assert.equal(row.expertNotesInternal, 'Nouveau')
    assert.isNull(row.executiveSummaryOverride)
  })

  test("404 sur un candidat d'une autre organisation, rien n'est créé", async ({ assert }) => {
    const { service, controller } = setup()
    const { ctx, flashes } = makeContext(
      await createAdvisor(),
      { id: String(employee.id) },
      { expertNotesInternal: 'Intrus' }
    )

    await expectRowNotFound(assert, () => controller.updateAdvisor(ctx))
    assert.lengthOf(service.getOrCreateRowCalls, 0)
    assert.isNull(await EmployeeSynthesis.findBy('employeeId', employee.id))
    assert.lengthOf(flashes, 0)
  })
})

test.group('EmployeeSynthesesController.share / unshare', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(seedAdvisor)

  test('share passe la synthèse en partagée et trace le conseiller', async ({ assert }) => {
    const { controller, notifications } = setup()
    const { ctx, flashes, state } = makeContext(advisor, { id: String(employee.id) })

    await controller.share(ctx)

    const row = await EmployeeSynthesis.findByOrFail('employeeId', employee.id)
    assert.equal(row.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED)
    assert.isNotNull(row.sharedAt)
    assert.equal(row.sharedByUserId, advisor.id)
    assert.deepEqual(flashes, [['success', 'Synthèse partagée au talent.']])
    assert.isTrue(state.redirectedBack)
    assert.deepEqual(notifications.synthesisSharedFor, [employee.id])
  })

  test('share d’une synthèse déjà partagée ne renotifie pas le candidat', async ({ assert }) => {
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: DateTime.now(),
      sharedByUserId: advisor.id,
    }).create()
    const { controller, notifications } = setup()
    const { ctx } = makeContext(advisor, { id: String(employee.id) })

    await controller.share(ctx)

    assert.deepEqual(notifications.synthesisSharedFor, [])
  })

  test('unshare repasse la synthèse en brouillon', async ({ assert }) => {
    await EmployeeSynthesisFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: DateTime.now(),
      sharedByUserId: advisor.id,
    }).create()
    const { controller } = setup()
    const { ctx, flashes, state } = makeContext(advisor, { id: String(employee.id) })

    await controller.unshare(ctx)

    const row = await EmployeeSynthesis.findByOrFail('employeeId', employee.id)
    assert.equal(row.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT)
    assert.isNull(row.sharedAt)
    assert.isNull(row.sharedByUserId)
    assert.deepEqual(flashes, [['success', 'Partage désactivé.']])
    assert.isTrue(state.redirectedBack)
  })

  test("share et unshare : 404 sur un candidat d'une autre organisation", async ({ assert }) => {
    const { service, controller } = setup()
    const intruder = await createAdvisor()

    await expectRowNotFound(assert, () =>
      controller.share(makeContext(intruder, { id: String(employee.id) }).ctx)
    )
    await expectRowNotFound(assert, () =>
      controller.unshare(makeContext(intruder, { id: String(employee.id) }).ctx)
    )
    assert.lengthOf(service.getOrCreateRowCalls, 0)
    assert.isNull(await EmployeeSynthesis.findBy('employeeId', employee.id))
  })
})

test.group('EmployeeSynthesesController.showCandidate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('synthèse absente : rend la vue non partagée sans appeler le service', async ({
    assert,
  }) => {
    const { user, employee: own } = await createCandidate()
    const { service, controller } = setup()
    const { ctx, rendered } = makeContext(user)

    await controller.showCandidate(ctx)

    assert.lengthOf(service.buildForCandidateCalls, 0)
    assert.deepEqual(rendered, [
      {
        component: 'dashboard/candidat/Synthesis',
        props: {
          shared: false,
          lockedReason: null,
          employeeId: String(own.id),
          employee: null,
          synthesis: null,
          latestCompletedByType: {},
          latestPdfJob: null,
        },
      },
    ])
  })

  test('synthèse en brouillon : rien ne fuit vers le candidat', async ({ assert }) => {
    const { user, employee: own } = await createCandidate()
    await EmployeeSynthesisFactory.merge({
      organizationId: user.organizationId,
      employeeId: own.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      sharedAt: null,
    }).create()
    const { service, controller } = setup()
    const { ctx, rendered } = makeContext(user)

    await controller.showCandidate(ctx)

    assert.lengthOf(service.buildForCandidateCalls, 0)
    assert.isFalse(rendered[0].props.shared)
    assert.isNull(rendered[0].props.synthesis)
  })

  test('synthèse partagée : rend la vue candidat et son dernier export', async ({ assert }) => {
    const { user, employee: own } = await createCandidate()
    await EmployeeSynthesisFactory.merge({
      organizationId: user.organizationId,
      employeeId: own.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: DateTime.now(),
    }).create()
    const pdf = await PdfExportFactory.merge({
      userId: user.id,
      organizationId: user.organizationId,
      employeeId: own.id,
      status: PDF_EXPORT_STATUSES.COMPLETED,
      filePath: 'exports/candidate.pdf',
    }).create()
    const { service, controller } = setup()
    const { ctx, rendered } = makeContext(user)

    await controller.showCandidate(ctx)

    assert.deepEqual(service.buildForCandidateCalls, [
      { organizationId: user.organizationId, employeeId: own.id },
    ])
    assert.deepEqual(rendered, [
      {
        component: 'dashboard/candidat/Synthesis',
        props: {
          shared: true,
          lockedReason: null,
          employeeId: String(own.id),
          employee: CANDIDATE_PAYLOAD.employee,
          synthesis: CANDIDATE_PAYLOAD.synthesis,
          latestCompletedByType: CANDIDATE_PAYLOAD.latestCompletedByType,
          latestPdfJob: {
            id: pdf.id,
            status: PDF_EXPORT_STATUSES.COMPLETED,
            downloadUrl: `/dashboard/pdf-exports/${pdf.id}/download`,
          },
        },
      },
    ])
  })

  test('404 si le compte connecté n’a pas de fiche candidat', async ({ assert }) => {
    const { controller } = setup()
    const { ctx, rendered } = makeContext(await createAdvisor())

    await expectRowNotFound(assert, () => controller.showCandidate(ctx))
    assert.lengthOf(rendered, 0)
  })
})
