import DashboardController from '#controllers/dashboard_controller'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import User from '#models/user'
import { EXERCISE_LIST, EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { USERS_ROLES } from '#shared/constants/user'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function makeCtx(user: any) {
  let renderedPage: string | null = null
  let renderedProps: any = null

  return {
    auth: { user },
    response: {
      unauthorizedCalled: false,
      unauthorized() {
        this.unauthorizedCalled = true
        return this
      },
      redirect(_url: string) {
        return this
      },
    },
    inertia: {
      render(page: string, props: any) {
        renderedPage = page
        renderedProps = props
        return props
      },
    },
    _renderedPage: () => renderedPage,
    _renderedProps: () => renderedProps,
  } as any
}

async function createCandidateFixture() {
  const org = await Organization.create({
    name: 'Dashboard Org',
    slug: `dashboard-org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    logoUrl: null,
  })

  const user = await User.create({
    organizationId: org.id,
    email: `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    name: 'Candidate',
    password: await hash.make('secret123'),
    role: USERS_ROLES.EMPLOYEE,
  })

  const employee = await Employee.create({
    organizationId: org.id,
    advisorId: null,
    userId: user.id,
    name: 'Candidate Employee',
    email: `employee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    currentRole: 'Dev',
    targetRole: 'Lead',
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
  })

  return { user, employee }
}

test.group('DashboardController.candidatHome completion stats', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('computes completion from latest status by exercise type', async ({ assert }) => {
    const { user, employee } = await createCandidateFixture()

    await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: 'completed',
      date: DateTime.fromISO('2026-01-01'),
      duration: 120,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })
    await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: 'draft',
      date: null,
      duration: null,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })
    await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: 'completed',
      date: DateTime.fromISO('2026-02-01'),
      duration: 90,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })

    const controller = new DashboardController()
    const ctx = makeCtx(user)

    await controller.candidatHome(ctx)

    assert.equal(ctx._renderedPage(), 'dashboard/employee/home/Home')
    assert.equal(ctx._renderedProps().completedExercises, 1)
    assert.equal(ctx._renderedProps().totalExercises, EXERCISE_LIST.length)
    assert.equal(
      ctx._renderedProps().exerciseCompletionPercent,
      Math.round((1 / EXERCISE_LIST.length) * 100)
    )
  })

  test('returns 0% when no exercise is completed', async ({ assert }) => {
    const { user } = await createCandidateFixture()
    const controller = new DashboardController()
    const ctx = makeCtx(user)

    await controller.candidatHome(ctx)

    assert.equal(ctx._renderedProps().completedExercises, 0)
    assert.equal(ctx._renderedProps().exerciseCompletionPercent, 0)
  })

  test('returns 100% when all exercises are completed', async ({ assert }) => {
    const { user, employee } = await createCandidateFixture()

    for (const exercise of EXERCISE_LIST) {
      await ExerciseResult.create({
        employeeId: employee.id,
        type: exercise.slug as any,
        status: 'completed',
        date: DateTime.fromISO('2026-03-01'),
        duration: 60,
        data: {},
        quantitativeScore: null,
        qualitativeAnalysis: null,
      })
    }

    const controller = new DashboardController()
    const ctx = makeCtx(user)

    await controller.candidatHome(ctx)

    assert.equal(ctx._renderedProps().completedExercises, EXERCISE_LIST.length)
    assert.equal(ctx._renderedProps().exerciseCompletionPercent, 100)
  })
})

