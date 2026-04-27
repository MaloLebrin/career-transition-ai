import DashboardController from '#controllers/dashboard_controller'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import User from '#models/user'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
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

async function createAdvisorFixture() {
  const org = await Organization.create({
    name: 'Advisor Org',
    slug: `advisor-org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    logoUrl: null,
  })

  const advisorUser = await User.create({
    organizationId: org.id,
    email: `advisor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    name: 'Advisor',
    password: await hash.make('secret123'),
    role: USERS_ROLES.ADVISOR,
  })

  const employee1 = await Employee.create({
    organizationId: org.id,
    advisorId: advisorUser.id,
    userId: null,
    name: 'Alice',
    email: `alice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    currentRole: 'Dev',
    targetRole: 'Lead',
    summary: null,
    advisorNotes: null,
    status: EMPLOYEES_STATUS.ACTIVE,
    onboarded: true,
  })

  const employee2 = await Employee.create({
    organizationId: org.id,
    advisorId: advisorUser.id,
    userId: null,
    name: 'Bob',
    email: `bob-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    currentRole: 'PM',
    targetRole: null,
    summary: null,
    advisorNotes: null,
    status: EMPLOYEES_STATUS.ONBOARDING,
    onboarded: false,
  })

  return { org, advisorUser, employee1, employee2 }
}

test.group('DashboardController.advisorHome', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renders advisor home with correct stats', async ({ assert }) => {
    const { advisorUser, employee1, employee2 } = await createAdvisorFixture()
    const now = DateTime.now()

    await SupportPlanStep.create({
      employeeId: employee1.id,
      advisorId: advisorUser.id,
      title: 'Séance 1',
      status: APPOINTMENTS_STATUSES.COMPLETED,
      completed: true,
      scheduledAt: now.minus({ days: 5 }),
      sortOrder: 0,
      isLocked: false,
    })

    await SupportPlanStep.create({
      employeeId: employee2.id,
      advisorId: advisorUser.id,
      title: 'RDV initial',
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      completed: false,
      scheduledAt: now.plus({ days: 3 }),
      sortOrder: 0,
      isLocked: false,
    })

    const controller = new DashboardController()
    const ctx = makeCtx(advisorUser)
    await controller.advisorHome(ctx)

    const props = ctx._renderedProps()
    assert.equal(ctx._renderedPage(), 'dashboard/conseiller/home/Home')
    assert.equal(props.stats.totalActive, 1)
    assert.equal(props.stats.pendingOnboarding, 1)
    assert.equal(props.stats.upcomingCount, 1)
    assert.equal(props.accompaniments.length, 2)

    const alice = props.accompaniments.find((a: any) => a.name === 'Alice')
    assert.equal(alice.completedSteps, 1)
    assert.equal(alice.totalSteps, 1)
    assert.equal(alice.progressPercent, 100)
    assert.isNull(alice.nextAppointment)

    const bob = props.accompaniments.find((a: any) => a.name === 'Bob')
    assert.equal(bob.completedSteps, 0)
    assert.equal(bob.totalSteps, 1)
    assert.equal(bob.progressPercent, 0)
    assert.isNotNull(bob.nextAppointment)
    assert.equal(bob.nextAppointment.title, 'RDV initial')

    assert.equal(props.upcomingAppointments.length, 1)
    assert.equal(props.upcomingAppointments[0].employeeName, 'Bob')
  })

  test('advisor sees only their own employees, not other advisors in same org', async ({
    assert,
  }) => {
    const { org, advisorUser } = await createAdvisorFixture()

    const otherAdvisor = await User.create({
      organizationId: org.id,
      email: `other-advisor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      name: 'Other Advisor',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    await Employee.create({
      organizationId: org.id,
      advisorId: otherAdvisor.id,
      userId: null,
      name: 'Other Employee',
      email: `other-emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      currentRole: 'Designer',
      targetRole: null,
      summary: null,
      advisorNotes: null,
      status: EMPLOYEES_STATUS.ACTIVE,
      onboarded: true,
    })

    const controller = new DashboardController()
    const ctx = makeCtx(advisorUser)
    await controller.advisorHome(ctx)

    const props = ctx._renderedProps()
    assert.equal(props.accompaniments.length, 2)
    assert.isFalse(props.accompaniments.some((a: any) => a.name === 'Other Employee'))
  })

  test('returns unauthorized when user is not authenticated', async ({ assert }) => {
    const controller = new DashboardController()
    const ctx = makeCtx(undefined)
    await controller.advisorHome(ctx)
    assert.isTrue(ctx.response.unauthorizedCalled)
  })

  test('upcomingAppointments are sorted chronologically', async ({ assert }) => {
    const { advisorUser, employee1, employee2 } = await createAdvisorFixture()
    const now = DateTime.now()

    await SupportPlanStep.create({
      employeeId: employee1.id,
      advisorId: advisorUser.id,
      title: 'Later RDV',
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      completed: false,
      scheduledAt: now.plus({ days: 10 }),
      sortOrder: 0,
      isLocked: false,
    })

    await SupportPlanStep.create({
      employeeId: employee2.id,
      advisorId: advisorUser.id,
      title: 'Earlier RDV',
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      completed: false,
      scheduledAt: now.plus({ days: 2 }),
      sortOrder: 0,
      isLocked: false,
    })

    const controller = new DashboardController()
    const ctx = makeCtx(advisorUser)
    await controller.advisorHome(ctx)

    const appts = ctx._renderedProps().upcomingAppointments
    assert.equal(appts[0].title, 'Earlier RDV')
    assert.equal(appts[1].title, 'Later RDV')
  })

  test('completedStepsThisMonth counts steps completed this month', async ({ assert }) => {
    const { advisorUser, employee1 } = await createAdvisorFixture()
    const now = DateTime.now()

    await SupportPlanStep.create({
      employeeId: employee1.id,
      advisorId: advisorUser.id,
      title: 'This month',
      status: APPOINTMENTS_STATUSES.COMPLETED,
      completed: true,
      scheduledAt: now.minus({ days: 5 }),
      sortOrder: 0,
      isLocked: false,
    })

    const controller = new DashboardController()
    const ctx = makeCtx(advisorUser)
    await controller.advisorHome(ctx)

    assert.isAtLeast(ctx._renderedProps().stats.completedStepsThisMonth, 1)
  })

  test('active employees sorted first in accompaniments', async ({ assert }) => {
    const { advisorUser } = await createAdvisorFixture()

    const controller = new DashboardController()
    const ctx = makeCtx(advisorUser)
    await controller.advisorHome(ctx)

    const accompaniments = ctx._renderedProps().accompaniments
    const firstActive = accompaniments.findIndex((a: any) => a.status === EMPLOYEES_STATUS.ACTIVE)
    const firstNonActive = accompaniments.findIndex(
      (a: any) => a.status !== EMPLOYEES_STATUS.ACTIVE
    )
    if (firstActive !== -1 && firstNonActive !== -1) {
      assert.isBelow(firstActive, firstNonActive)
    }
  })
})

test.group('DashboardController.candidatHome completion stats', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('computes completion from latest status by exercise type', async ({ assert }) => {
    const { user, employee } = await createCandidateFixture()

    await ExerciseResult.create({
      employeeId: employee.id,
      type: 'motivation',
      status: 'completed',
      date: DateTime.fromISO('2026-01-01'),
      duration: 120,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })
    await ExerciseResult.create({
      employeeId: employee.id,
      type: 'motivation',
      status: 'draft',
      date: null,
      duration: null,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })
    await ExerciseResult.create({
      employeeId: employee.id,
      type: 'values',
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
    assert.isDefined(ctx._renderedProps().exerciseProgressByType)
    assert.isAtLeast(ctx._renderedProps().exerciseProgressByType.motivation ?? 0, 0)
    assert.isAtMost(ctx._renderedProps().exerciseProgressByType.motivation ?? 0, 100)
    assert.isAtLeast(ctx._renderedProps().exerciseProgressByType.values ?? 0, 0)
    assert.isAtMost(ctx._renderedProps().exerciseProgressByType.values ?? 0, 100)
  })

  test('returns 0% when no exercise is completed', async ({ assert }) => {
    const { user } = await createCandidateFixture()
    const controller = new DashboardController()
    const ctx = makeCtx(user)

    await controller.candidatHome(ctx)

    assert.equal(ctx._renderedProps().completedExercises, 0)
    assert.equal(ctx._renderedProps().exerciseCompletionPercent, 0)
    assert.equal(ctx._renderedProps().exerciseProgressByType.motivation, 0)
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
    assert.isAtLeast(ctx._renderedProps().exerciseProgressByType.life_curve ?? 0, 0)
    assert.isAtMost(ctx._renderedProps().exerciseProgressByType.life_curve ?? 0, 100)
  })
})
