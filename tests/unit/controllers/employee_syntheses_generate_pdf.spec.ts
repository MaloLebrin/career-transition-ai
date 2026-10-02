import EmployeeSynthesesController from '#controllers/employee_syntheses_controller'
import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import Organization from '#models/organization'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import type { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { test } from '@japa/runner'

// ─── helpers ──────────────────────────────────────────────────────────────────

const flashes: Record<string, any> = {}

function makeRedirectResponse() {
  const redirected = { called: false, back: false }
  return {
    redirected,
    response: {
      redirect() {
        return {
          back() {
            redirected.called = true
            redirected.back = true
          },
        }
      },
    },
  }
}

function makeCtx(overrides: any = {}) {
  const { redirected, response } = makeRedirectResponse()
  return {
    redirected,
    params: overrides.params ?? {},
    auth: overrides.auth ?? { user: null },
    response,
    session: {
      flash(key: string, value: any) {
        flashes[key] = value
      },
    },
    inertia: {
      rendered: null as any,
      render(name: string, props: any) {
        this.rendered = { name, props }
        return this.rendered
      },
    },
    ...overrides,
  } as any
}

async function seedAdvisorWithEmployee(prefix: string) {
  const ts = Date.now()
  const org = await Organization.create({
    name: `${prefix} Org`,
    slug: `${prefix}-${ts}`,
    logoUrl: null,
  })
  const advisorUser = await User.create({
    organizationId: org.id,
    email: `${prefix}-advisor-${ts}@example.com`,
    password: 'secretsecret',
    name: 'Advisor',
    role: USERS_ROLES.ADVISOR as any,
  })
  const candidateUser = await User.create({
    organizationId: org.id,
    email: `${prefix}-candidate-${ts}@example.com`,
    password: 'secretsecret',
    name: 'Candidate',
    role: USERS_ROLES.EMPLOYEE as any,
  })
  const employee = await Employee.create({
    organizationId: org.id,
    advisorId: advisorUser.id,
    userId: candidateUser.id,
    name: 'Employee',
    email: `${prefix}-emp-${ts}@example.com`,
    currentRole: 'Dev',
    targetRole: null,
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
  })
  return { org, advisorUser, candidateUser, employee }
}

// Vrai service de synthèse (il porte désormais les lectures et la création d'export, #101) ;
// les notifications ne sont pas appelées ici.
function makeController() {
  return new EmployeeSynthesesController(
    new EmployeeSynthesisService(),
    {} as CandidateNotificationsService,
    new EntitlementsService()
  )
}

// ─── generateShareablePdfAdvisor ──────────────────────────────────────────────

test.group('EmployeeSynthesesController.generateShareablePdfAdvisor', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  // Queue `sync` en test : le job écrit le PDF, dans le Cloudinary factice.
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })
  group.each.teardown(() => {
    delete flashes['error']
    delete flashes['success']
  })

  test("redirige avec erreur si la synthèse n'existe pas", async ({ assert }) => {
    const { org, advisorUser, employee } = await seedAdvisorWithEmployee('gen-adv-no-synthesis')

    const ctx = makeCtx({
      auth: { user: { id: advisorUser.id, organizationId: org.id, role: USERS_ROLES.ADVISOR } },
      params: { id: String(employee.id) },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfAdvisor(ctx)

    assert.equal(flashes['error'], 'La synthèse doit être partagée avant génération PDF.')
    assert.isTrue(ctx.redirected.back)
  })

  test("redirige avec erreur si la synthèse n'est pas partagée (draft)", async ({ assert }) => {
    const { org, advisorUser, employee } = await seedAdvisorWithEmployee('gen-adv-draft')

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      sharedAt: null,
      sharedByUserId: advisorUser.id,
      expertCommentsShared: null,
      expertNotesInternal: null,
      executiveSummaryOverride: null,
    })

    const ctx = makeCtx({
      auth: { user: { id: advisorUser.id, organizationId: org.id, role: USERS_ROLES.ADVISOR } },
      params: { id: String(employee.id) },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfAdvisor(ctx)

    assert.equal(flashes['error'], 'La synthèse doit être partagée avant génération PDF.')
    assert.isTrue(ctx.redirected.back)
  })

  test('crée un PdfExport PENDING et redirige avec succès', async ({ assert }) => {
    const { org, advisorUser, employee } = await seedAdvisorWithEmployee('gen-adv-ok')

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: null,
      sharedByUserId: advisorUser.id,
      expertCommentsShared: 'Commentaires',
      expertNotesInternal: null,
      executiveSummaryOverride: null,
    })

    const countBefore = await PdfExport.query().where('employeeId', employee.id).count('* as total')
    const before = Number((countBefore[0] as any).$extras.total ?? (countBefore[0] as any).total)

    const ctx = makeCtx({
      auth: { user: { id: advisorUser.id, organizationId: org.id, role: USERS_ROLES.ADVISOR } },
      params: { id: String(employee.id) },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfAdvisor(ctx)

    assert.equal(flashes['success'], 'Génération PDF lancée.')
    assert.isTrue(ctx.redirected.back)

    // Un enregistrement PdfExport doit avoir été créé en base
    const countAfter = await PdfExport.query().where('employeeId', employee.id).count('* as total')
    const after = Number((countAfter[0] as any).$extras.total ?? (countAfter[0] as any).total)
    assert.equal(after, before + 1)

    // Vérification des champs métier (le job peut avoir déjà tourné en mode sync)
    const created = await PdfExport.query()
      .where('employeeId', employee.id)
      .orderBy('createdAt', 'desc')
      .first()
    assert.isNotNull(created)
    assert.equal(created!.userId, advisorUser.id)
    assert.equal(created!.advisorUserId, advisorUser.id)
    assert.equal(created!.organizationId, org.id)
    // Le statut doit être soit pending (pas encore traité) soit completed/failed (traité en sync)
    assert.isTrue(
      [
        PDF_EXPORT_STATUSES.PENDING,
        PDF_EXPORT_STATUSES.COMPLETED,
        PDF_EXPORT_STATUSES.FAILED,
      ].includes(created!.status)
    )
  })
})

// ─── generateShareablePdfCandidate ────────────────────────────────────────────

test.group('EmployeeSynthesesController.generateShareablePdfCandidate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  // Queue `sync` en test : le job écrit le PDF, dans le Cloudinary factice.
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })
  group.each.teardown(() => {
    delete flashes['error']
    delete flashes['success']
  })

  test("redirige avec erreur si la synthèse n'existe pas", async ({ assert }) => {
    const { org, candidateUser } = await seedAdvisorWithEmployee('gen-cand-no-synthesis')

    const ctx = makeCtx({
      auth: { user: { id: candidateUser.id, organizationId: org.id, role: USERS_ROLES.EMPLOYEE } },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfCandidate(ctx)

    assert.equal(flashes['error'], 'La synthèse doit être partagée avant génération PDF.')
    assert.isTrue(ctx.redirected.back)
  })

  test('redirige avec erreur si la synthèse est en draft', async ({ assert }) => {
    const { org, advisorUser, candidateUser, employee } =
      await seedAdvisorWithEmployee('gen-cand-draft')

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
      sharedAt: null,
      sharedByUserId: advisorUser.id,
      expertCommentsShared: null,
      expertNotesInternal: null,
      executiveSummaryOverride: null,
    })

    const ctx = makeCtx({
      auth: { user: { id: candidateUser.id, organizationId: org.id, role: USERS_ROLES.EMPLOYEE } },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfCandidate(ctx)

    assert.equal(flashes['error'], 'La synthèse doit être partagée avant génération PDF.')
    assert.isTrue(ctx.redirected.back)
  })

  test('crée un PdfExport PENDING avec advisorUserId et redirige avec succès', async ({
    assert,
  }) => {
    const { org, advisorUser, candidateUser, employee } =
      await seedAdvisorWithEmployee('gen-cand-ok')

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: null,
      sharedByUserId: advisorUser.id,
      expertCommentsShared: 'Commentaires',
      expertNotesInternal: null,
      executiveSummaryOverride: null,
    })

    const ctx = makeCtx({
      auth: {
        user: { id: candidateUser.id, organizationId: org.id, role: USERS_ROLES.EMPLOYEE },
      },
    })

    // @ts-expect-error minimal context
    await makeController().generateShareablePdfCandidate(ctx)

    assert.equal(flashes['success'], 'Génération PDF lancée.')
    assert.isTrue(ctx.redirected.back)

    const created = await PdfExport.query()
      .where('employeeId', employee.id)
      .orderBy('createdAt', 'desc')
      .first()

    assert.isNotNull(created)
    assert.equal(created!.userId, candidateUser.id)
    // L'advisorUserId doit être renseigné car l'employé a un conseiller
    assert.equal(created!.advisorUserId, advisorUser.id)
    // Le statut peut être pending ou completed/failed (job synchrone en test)
    assert.isTrue(
      [
        PDF_EXPORT_STATUSES.PENDING,
        PDF_EXPORT_STATUSES.COMPLETED,
        PDF_EXPORT_STATUSES.FAILED,
      ].includes(created!.status)
    )
  })
})
