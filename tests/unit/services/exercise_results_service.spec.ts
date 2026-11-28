import app from '@adonisjs/core/services/app'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import {
  awaitsQualitativeAnalysisInline,
  ExerciseResultsService,
} from '#services/exercise_results_service'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import {
  EXERCICE_RESULTS_TYPES,
  exerciceResultStatusValues,
  QUALITATIVE_ANALYSIS_STATUSES,
} from '#shared/constants/exercises'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { EmployeeNotFoundError } from '#exceptions/employee_errors'
import {
  ExerciseResultNotFoundError,
  QualitativeAnalysisNotRetryableError,
} from '#exceptions/exercise_result_errors'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createOrganization,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ExerciseResultsService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("l'analyse synchrone n'est pas attendue hors des tests", ({ assert }) => {
    assert.isFalse(awaitsQualitativeAnalysisInline('sync', false))
    assert.isTrue(awaitsQualitativeAnalysisInline('sync', true))
    assert.isTrue(awaitsQualitativeAnalysisInline('database', false))
    assert.isTrue(awaitsQualitativeAnalysisInline('database', true))
  })
  test('saveResult creates exercise result and updates plan', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'Exercise Org',
      slug: `exercise-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Exercise Candidate',
      email: 'exercise@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const step = await SupportPlanStep.create({
      employeeId: employee.id,
      advisorId: null,
      title: 'Étape exercice',
      description: 'Faire un exercice',
      instructions: null,
      dueDate: DateTime.fromISO('2025-01-10'),
      scheduledAt: null,
      endedAt: null,
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: null,
      completed: false,
      notes: null,
      sortOrder: 1,
      isLocked: false,
    })

    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.MOTIVATION,
      sortOrder: 0,
    })

    const dto = await service.saveResult({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2025-01-05',
      duration: 30,
      data: { foo: 'bar' },
      quantitativeScore: 10,
      qualitativeAnalysis: 'Analyse',
      plan: [
        {
          id: step.id,
          completed: true,
          lastUpdated: DateTime.fromISO('2025-01-05T10:00:00').toISO() || undefined,
        },
      ],
    })

    assert.equal(dto.id, employee.id)
    assert.lengthOf(dto.exercises, 1)
    assert.equal(dto.exercises[0].type, 'MOTIVATION')
    assert.equal(dto.exercises[0].quantitativeScore, 10)
    assert.lengthOf(dto.plan, 1)
    assert.isTrue(dto.plan[0].completed)

    const stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .first()

    assert.isNotNull(stored)
    assert.isAtLeast(stored!.progressPercent ?? 0, 0)
    assert.isAtMost(stored!.progressPercent ?? 0, 100)
    assert.equal(stored!.status, exerciceResultStatusValues.COMPLETED)
    assert.equal(stored!.progressPercent, 100)
  })

  test('saveResult marks a step completed only when all associated exercises are completed', async ({
    assert,
  }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'Multi Exercise Org',
      slug: `multi-exercise-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Multi Exercise Candidate',
      email: 'multi-exercise@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const step = await SupportPlanStep.create({
      employeeId: employee.id,
      advisorId: null,
      title: 'RDV multi-exercices',
      description: 'Contient plusieurs exercices',
      instructions: null,
      dueDate: DateTime.fromISO('2025-01-10'),
      scheduledAt: null,
      endedAt: null,
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: null,
      completed: false,
      notes: null,
      sortOrder: 1,
      isLocked: false,
    })

    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.MOTIVATION,
      sortOrder: 0,
    })
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 1,
    })

    await service.saveResult({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2025-01-05',
      duration: 30,
      data: { foo: 'bar' },
      quantitativeScore: 10,
      qualitativeAnalysis: 'Analyse',
      plan: [{ id: step.id, completed: true }],
    })

    const stepAfterFirst = await SupportPlanStep.findOrFail(step.id)
    assert.isFalse(stepAfterFirst.completed)

    await service.saveResult({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2025-01-06',
      duration: 20,
      data: { answers: [] },
      quantitativeScore: 8,
      qualitativeAnalysis: '',
      plan: [{ id: step.id, completed: true }],
    })

    const stepAfterSecond = await SupportPlanStep.findOrFail(step.id)
    assert.isTrue(stepAfterSecond.completed)
  })

  test('saveDraft creates or updates draft result', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'Draft Org',
      slug: `draft-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Draft Candidate',
      email: 'draft@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    await service.saveDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      data: { foo: 'bar' },
    })

    let stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .first()

    assert.isNotNull(stored)
    assert.equal(stored!.status, 'draft')
    assert.equal((stored!.data as any).foo, 'bar')
    assert.isAtLeast(stored!.progressPercent ?? 0, 0)
    assert.isAtMost(stored!.progressPercent ?? 0, 100)

    await service.saveDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      data: { foo: 'baz' },
    })

    stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .first()

    assert.isNotNull(stored)
    assert.equal(stored!.status, 'draft')
    assert.equal((stored!.data as any).foo, 'baz')
    assert.isAtLeast(stored!.progressPercent ?? 0, 0)
    assert.isAtMost(stored!.progressPercent ?? 0, 100)
  })

  test('saveDraft is safe under concurrent calls (one draft per employee + type)', async ({
    assert,
  }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'Concurrent Draft Org',
      slug: `concurrent-draft-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Concurrent Draft Candidate',
      email: 'concurrent-draft@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const type = EXERCICE_RESULTS_TYPES.SKILL_MAPPING

    const r1 = service.saveDraft({
      employeeId: employee.id,
      type,
      data: { foo: 'a' },
    })
    const r2 = service.saveDraft({
      employeeId: employee.id,
      type,
      data: { foo: 'b' },
    })

    await Promise.all([r1, r2])

    const drafts = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', type)
      .andWhere('status', 'draft')

    assert.equal(drafts.length, 1)
    assert.equal(drafts[0].employeeId, employee.id)
    assert.equal(drafts[0].type, type)
  })

  test('saveDraft does not downgrade a completed result', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'No Downgrade Org',
      slug: `no-downgrade-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'No Downgrade Candidate',
      email: 'no-downgrade@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const completedData = { points: [{ year: 2020, satisfaction: 8, label: 'A' }] }

    await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
      status: exerciceResultStatusValues.COMPLETED,
      date: DateTime.fromISO('2026-03-01'),
      duration: 60,
      data: completedData,
      quantitativeScore: 10,
      qualitativeAnalysis: 'Analyse',
    })

    await service.saveDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
      data: { points: [] },
    })

    const stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.LIFE_CURVE)
      .first()

    assert.isNotNull(stored)
    assert.equal(stored!.status, exerciceResultStatusValues.COMPLETED)
    assert.deepEqual(stored!.data, completedData)
    assert.equal(stored!.qualitativeAnalysis, 'Analyse')
  })

  test('fetchDraft returns null when no draft and dto when exists', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'FetchDraft Org',
      slug: `fetch-draft-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Fetch Draft Candidate',
      email: 'fetch-draft@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    let draft = await service.fetchDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      data: {},
    })

    assert.isNull(draft)

    await service.saveDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      data: { foo: 'bar' },
    })

    draft = await service.fetchDraft({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      data: {},
    })

    assert.isNotNull(draft)
    assert.equal(draft!.employeeId, employee.id)
    assert.equal(draft!.type, EXERCICE_RESULTS_TYPES.MOTIVATION)
    assert.equal((draft!.data as any).foo, 'bar')
    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .first()

    assert.isNotNull(row)
    assert.isAtLeast(row!.progressPercent ?? 0, 0)
    assert.isAtMost(row!.progressPercent ?? 0, 100)
    assert.isString(draft!.lastUpdated)
  })

  test('saveResult completed runs qualitative analysis job (QUEUE_DRIVER=sync)', async ({
    assert,
  }) => {
    const service = await app.container.make(ExerciseResultsService)
    const org = await Organization.create({
      name: 'AI Hook Org',
      slug: `ai-hook-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'AI Candidate',
      email: 'ai-candidate@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const step = await SupportPlanStep.create({
      employeeId: employee.id,
      advisorId: null,
      title: 'Étape',
      description: '',
      instructions: null,
      dueDate: DateTime.fromISO('2025-01-10'),
      scheduledAt: null,
      endedAt: null,
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: null,
      completed: false,
      notes: null,
      sortOrder: 1,
      isLocked: false,
    })

    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.DISC,
      sortOrder: 0,
    })

    await service.saveResult({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2025-01-05',
      duration: 20,
      data: { answers: [] },
      quantitativeScore: 8,
      qualitativeAnalysis: '',
      plan: [{ id: step.id, completed: true }],
    })

    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .andWhere('type', EXERCICE_RESULTS_TYPES.DISC)
      .first()

    assert.isNotNull(row)
    assert.isString(row!.qualitativeAnalysis)
    assert.isAbove(row!.qualitativeAnalysis!.length, 5)
  })
})

/**
 * Politique d'analyse IA B2C (#100). Queue `sync` + `AI_PROVIDER=none` : quand
 * le job est lancé, `qualitativeAnalysis` est rempli dans la foulée.
 */
test.group('ExerciseResultsService.saveResult — politique IA B2C (#100)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function completed(type: string) {
    return {
      type: type as any,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2026-01-05',
      duration: 30,
      data: { step: 2 },
      plan: [],
    }
  }

  test('exercice gratuit : analysé une seule fois', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createB2cCandidate()

    await service.saveResult({
      employeeId: employee.id,
      ...completed(EXERCICE_RESULTS_TYPES.VALUES),
    })
    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.VALUES)
      .firstOrFail()
    assert.isNotNull(row.qualitativeAnalysis)

    row.qualitativeAnalysis = 'Première analyse'
    await row.save()
    await service.saveResult({
      employeeId: employee.id,
      ...completed(EXERCICE_RESULTS_TYPES.VALUES),
    })

    await row.refresh()
    assert.equal(row.qualitativeAnalysis, 'Première analyse')
  })

  test('exercice verrouillé (non payé) : jamais analysé', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createB2cCandidate()

    await service.saveResult({ employeeId: employee.id, ...completed(EXERCICE_RESULTS_TYPES.DISC) })

    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.DISC)
      .firstOrFail()
    assert.isNull(row.qualitativeAnalysis)
  })

  test('forfait payé : analysé à chaque résultat', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createB2cCandidate({ paid: true })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      qualitativeAnalysis: 'Ancienne analyse',
    }).create()

    await service.saveResult({ employeeId: employee.id, ...completed(EXERCICE_RESULTS_TYPES.DISC) })

    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.DISC)
      .firstOrFail()
    assert.notEqual(row.qualitativeAnalysis, 'Ancienne analyse')
  })

  test('B2B : relancé même si une analyse existe (comportement inchangé)', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createCandidate()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      qualitativeAnalysis: 'Ancienne analyse',
    }).create()

    await service.saveResult({
      employeeId: employee.id,
      ...completed(EXERCICE_RESULTS_TYPES.MOTIVATION),
    })

    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .firstOrFail()
    assert.notEqual(row.qualitativeAnalysis, 'Ancienne analyse')
  })
})

test.group('ExerciseResultsService.findDraftOrCompletedForCandidate (#100)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sans historique : rien, progression 0', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createCandidate()

    const state = await service.findDraftOrCompletedForCandidate(
      employee.id,
      EXERCICE_RESULTS_TYPES.VALUES
    )

    assert.deepEqual(state, { initialDraft: null, exerciseProgressPercent: 0 })
  })

  test('le brouillon prime sur le résultat terminé', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createCandidate()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      data: { step: 1, profile: 'D' },
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.DRAFT,
      date: null,
      data: { step: 1, answers: [1] },
    }).create()

    const state = await service.findDraftOrCompletedForCandidate(
      employee.id,
      EXERCICE_RESULTS_TYPES.DISC
    )

    assert.deepEqual(state.initialDraft?.data, { step: 1, answers: [1] })
    assert.equal(state.initialDraft?.employeeId, employee.id)
    assert.equal(state.initialDraft?.type, EXERCICE_RESULTS_TYPES.DISC)
  })

  test('sans brouillon : résultat terminé pré-rempli à l’étape 2, progression 100', async ({
    assert,
  }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createCandidate()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      data: { step: 1, profile: 'D' },
    }).create()

    const state = await service.findDraftOrCompletedForCandidate(
      employee.id,
      EXERCICE_RESULTS_TYPES.DISC
    )

    assert.deepEqual(state.initialDraft?.data, { step: 2, profile: 'D' })
    assert.equal(state.exerciseProgressPercent, 100)
  })
})

test.group('ExerciseResultsService — contournement de l’analyse gratuite (M5)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('completed → draft → saveDraft ne rouvre pas le droit à une analyse', async ({ assert }) => {
    const service = await app.container.make(ExerciseResultsService)
    const { employee } = await createB2cCandidate()
    const type = EXERCICE_RESULTS_TYPES.VALUES
    const base = { employeeId: employee.id, type, plan: [] }

    await service.saveResult({
      ...base,
      status: exerciceResultStatusValues.COMPLETED,
      data: { step: 2 },
    })
    const row = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', type)
      .firstOrFail()
    row.qualitativeAnalysis = 'Première analyse'
    await row.save()

    await service.saveResult({
      ...base,
      status: exerciceResultStatusValues.DRAFT,
      data: { step: 1 },
    })
    await service.saveDraft({ employeeId: employee.id, type, data: { step: 1, edit: true } })
    await row.refresh()
    assert.equal(row.qualitativeAnalysis, 'Première analyse')

    await service.saveResult({
      ...base,
      status: exerciceResultStatusValues.COMPLETED,
      data: { step: 2 },
    })
    await row.refresh()
    assert.equal(row.qualitativeAnalysis, 'Première analyse')
  })
})

test.group('ExerciseResultsService.resetForEmployee (#72)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new ExerciseResultsService({} as any)

  test('supprime brouillons et résultats du type, garde les autres exercices', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({
      organization: await advisor.related('organization').query().firstOrFail(),
      advisor,
    })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).createMany(2)
    const disc = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
    }).create()

    await service.resetForEmployee(advisor, employee.id, 'VALUES')

    const left = await ExerciseResult.query().where('employeeId', employee.id)
    assert.deepEqual(
      left.map((r) => r.id),
      [disc.id]
    )
  })

  test('rien à réinitialiser ou type inconnu → ExerciseResultNotFoundError', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({
      organization: await advisor.related('organization').query().firstOrFail(),
      advisor,
    })

    await assert.rejects(
      () => service.resetForEmployee(advisor, employee.id, 'values'),
      ExerciseResultNotFoundError
    )
    await assert.rejects(
      () => service.resetForEmployee(advisor, employee.id, 'xyz'),
      ExerciseResultNotFoundError
    )
  })

  test('candidat hors périmètre → EmployeeNotFoundError, résultats conservés', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ organization: await createOrganization() })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).create()

    await assert.rejects(
      () => service.resetForEmployee(advisor, employee.id, 'values'),
      EmployeeNotFoundError
    )
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 1)
  })
})

test.group('ExerciseResultsService.retryFailedAnalysis (#171)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function advisorWithCandidate() {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({
      organization: await advisor.related('organization').query().firstOrFail(),
      advisor,
    })
    return { advisor, employee }
  }

  test('relance une analyse `failed` : le job tourne et enregistre l’analyse', async ({
    assert,
  }) => {
    const { advisor, employee } = await advisorWithCandidate()
    const result = await ExerciseResultFactory.apply('analysisFailed')
      .merge({ employeeId: employee.id, type: EXERCICE_RESULTS_TYPES.VALUES })
      .create()
    const service = await app.container.make(ExerciseResultsService)

    await service.retryFailedAnalysis(advisor, employee.id, 'VALUES')

    await result.refresh()
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.DONE)
    assert.equal(result.qualitativeAnalysis, await new NullAiTextProvider().completeText(''))
  })

  test('analyse non en échec (terminée, en cours ou jamais demandée) → refus', async ({
    assert,
  }) => {
    const { advisor, employee } = await advisorWithCandidate()
    const service = await app.container.make(ExerciseResultsService)
    const statuses = [
      QUALITATIVE_ANALYSIS_STATUSES.DONE,
      QUALITATIVE_ANALYSIS_STATUSES.PENDING,
      null,
    ] as const
    const types = [
      EXERCICE_RESULTS_TYPES.VALUES,
      EXERCICE_RESULTS_TYPES.DISC,
      EXERCICE_RESULTS_TYPES.MOTIVATION,
    ] as const
    await ExerciseResultFactory.merge(
      statuses.map((status, index) => ({
        employeeId: employee.id,
        type: types[index],
        qualitativeAnalysisStatus: status,
      }))
    ).createMany(3)

    for (const type of types) {
      await assert.rejects(
        () => service.retryFailedAnalysis(advisor, employee.id, type),
        QualitativeAnalysisNotRetryableError
      )
    }
  })

  test('aucun résultat terminé ou type inconnu → ExerciseResultNotFoundError', async ({
    assert,
  }) => {
    const { advisor, employee } = await advisorWithCandidate()
    await ExerciseResultFactory.apply('analysisFailed')
      .merge({
        employeeId: employee.id,
        type: EXERCICE_RESULTS_TYPES.VALUES,
        status: exerciceResultStatusValues.DRAFT,
      })
      .create()
    const service = await app.container.make(ExerciseResultsService)

    await assert.rejects(
      () => service.retryFailedAnalysis(advisor, employee.id, 'values'),
      ExerciseResultNotFoundError
    )
    await assert.rejects(
      () => service.retryFailedAnalysis(advisor, employee.id, 'xyz'),
      ExerciseResultNotFoundError
    )
  })

  test('candidat hors périmètre → EmployeeNotFoundError, statut inchangé', async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({ organization: await createOrganization() })
    const result = await ExerciseResultFactory.apply('analysisFailed')
      .merge({ employeeId: employee.id, type: EXERCICE_RESULTS_TYPES.VALUES })
      .create()
    const service = await app.container.make(ExerciseResultsService)

    await assert.rejects(
      () => service.retryFailedAnalysis(advisor, employee.id, 'values'),
      EmployeeNotFoundError
    )
    await result.refresh()
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.FAILED)
  })

  test('B2C : exercice verrouillé (forfait non réglé) → refus, statut inchangé', async ({
    assert,
  }) => {
    const expert = await createInHouseExpert()
    const { employee } = await createB2cCandidate({ expert })
    const locked = Object.values(EXERCICE_RESULTS_TYPES).find(
      (type) => !B2C_FREE_EXERCISE_TYPES.includes(type as any)
    )!
    const result = await ExerciseResultFactory.apply('analysisFailed')
      .merge({ employeeId: employee.id, type: locked })
      .create()
    const service = await app.container.make(ExerciseResultsService)

    await assert.rejects(
      () => service.retryFailedAnalysis(expert, employee.id, locked),
      QualitativeAnalysisNotRetryableError
    )
    await result.refresh()
    assert.equal(result.qualitativeAnalysisStatus, QUALITATIVE_ANALYSIS_STATUSES.FAILED)
  })
})
