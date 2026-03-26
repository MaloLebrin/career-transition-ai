import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { ExerciseResultsService } from '#domains/exercises/services/exercise_results_service'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ExerciseResultsService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('saveResult creates exercise result and updates plan', async ({ assert }) => {
    const service = new ExerciseResultsService()
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
  })

  test('saveDraft creates or updates draft result', async ({ assert }) => {
    const service = new ExerciseResultsService()
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
    assert.deepEqual(stored!.data, { foo: 'bar' })

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
    assert.deepEqual(stored!.data, { foo: 'baz' })
  })

  test('saveDraft does not downgrade a completed result', async ({ assert }) => {
    const service = new ExerciseResultsService()
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
    const service = new ExerciseResultsService()
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
    assert.deepEqual(draft!.data, { foo: 'bar' })
    assert.isString(draft!.lastUpdated)
  })

  test('saveResult completed runs qualitative analysis job (QUEUE_DRIVER=sync)', async ({
    assert,
  }) => {
    const service = new ExerciseResultsService()
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
