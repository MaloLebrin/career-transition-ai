import ExerciseResultsController from '#controllers/exercise_results_controller'
import { ExerciseResultsService } from '#services/exercise_results_service'
import { EXERCICE_RESULTS_TYPES, EXERCISE_LIST } from '#shared/constants/exercises'
import { test } from '@japa/runner'

const fakeEmployeesService = {
  getEmployeeForUser: async () => ({ id: 1, exerciseResults: [] }),
} as any

function makeCtx(overrides: any = {}) {
  const flashes: Record<string, any> = {}
  let inertiaRenderPage: string | null = null
  let inertiaRenderProps: any = null

  return {
    auth: overrides.auth ?? { user: { id: 1, organizationId: 10 } },
    params: overrides.params ?? { id: 1, type: EXERCICE_RESULTS_TYPES.MOTIVATION },
    request: overrides.request ?? {
      validateUsing: async () => ({
        type: EXERCICE_RESULTS_TYPES.MOTIVATION,
        status: 'completed',
        date: '2025-01-01',
        duration: 120,
        data: { foo: 'bar' },
        quantitativeScore: 10,
        qualitativeAnalysis: 'ok',
        plan: [],
      }),
    },
    response: {
      unauthorizedCalled: false,
      redirectUrl: '',
      redirectBackCalled: false,
      unauthorized() {
        this.unauthorizedCalled = true
        return this
      },
      redirect(url?: string) {
        if (url !== undefined) {
          this.redirectUrl = url
          return this
        }
        return {
          back: () => {
            this.redirectBackCalled = true
          },
        }
      },
      jsonBody: undefined as any,
      json(body: any) {
        this.jsonBody = body
        return this
      },
      noContentCalled: false,
      noContent() {
        this.noContentCalled = true
        return this
      },
    },
    session: {
      flash(key: string, value: any) {
        flashes[key] = value
      },
    },
    inertia: {
      render(page: string, props: any) {
        inertiaRenderPage = page
        inertiaRenderProps = props
        return props
      },
    },
    flashes,
    _inertiaRenderPage: () => inertiaRenderPage,
    _inertiaRenderProps: () => inertiaRenderProps,
  } as any
}

test.group('ExerciseResultsController.storeFromDashboard', () => {
  test('returns unauthorized when no auth user', async ({ assert }) => {
    const service = {
      saveResult: async () => {},
    } as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)
    const ctx = makeCtx({ auth: { user: null } })

    await controller.storeFromDashboard(ctx)

    assert.isTrue(ctx.response.unauthorizedCalled)
  })

  test('calls service and flashes dynamic success message', async ({ assert }) => {
    const saveResult = async () => {}
    const service = { saveResult } as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)
    const ctx = makeCtx()

    await controller.storeFromDashboard(ctx)

    assert.equal(ctx.response.redirectUrl, '/dashboard/conseiller/employees/1')
    assert.equal(ctx.flashes.success, 'Exercice Motivation enregistré.')
  })

  test('uses correct label for different exercise types', async ({ assert }) => {
    const calls: any[] = []
    const service = {
      saveResult: async (input: any) => {
        calls.push(input)
        return {}
      },
    } as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)

    const motivationCtx = makeCtx()
    await controller.storeFromDashboard(motivationCtx)
    assert.equal(motivationCtx.flashes.success, 'Exercice Motivation enregistré.')

    const valuesCtx = makeCtx({
      request: {
        validateUsing: async () => ({
          type: EXERCICE_RESULTS_TYPES.VALUES,
          status: 'completed',
          date: '2025-01-01',
          duration: 120,
          data: {},
          quantitativeScore: null,
          qualitativeAnalysis: null,
          plan: [],
        }),
      },
    })
    await controller.storeFromDashboard(valuesCtx)
    assert.equal(valuesCtx.flashes.success, 'Exercice Valeurs enregistré.')
  })
})

test.group('ExerciseResultsController.exerciseListCandidat', () => {
  test('returns unauthorized when no auth user', async ({ assert }) => {
    const service = {} as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)
    const ctx = makeCtx({ auth: { user: null } })

    await controller.exerciseListCandidat(ctx)

    assert.isTrue(ctx.response.unauthorizedCalled)
  })

  test('renders dashboard/exercises/List with exercises and context candidat', async ({
    assert,
  }) => {
    const service = {
      getUnlockedExerciseSlugsForEmployee: async () => [EXERCICE_RESULTS_TYPES.MOTIVATION],
    } as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)
    const ctx = makeCtx()

    await controller.exerciseListCandidat(ctx)

    assert.equal(ctx._inertiaRenderPage(), 'dashboard/employee/exercises/List')
    assert.deepEqual(ctx._inertiaRenderProps().exercises, EXERCISE_LIST)
    assert.deepEqual(ctx._inertiaRenderProps().unlockedExerciseSlugs, [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
    ])
    assert.deepEqual(ctx._inertiaRenderProps().completedExerciseSlugs, [])
  })

  test('returns completedExerciseSlugs from latest status by type', async ({ assert }) => {
    const service = {
      getUnlockedExerciseSlugsForEmployee: async () => [
        EXERCICE_RESULTS_TYPES.MOTIVATION,
        EXERCICE_RESULTS_TYPES.VALUES,
      ],
    } as unknown as ExerciseResultsService
    const employeeService = {
      getEmployeeForUser: async () => ({
        id: 1,
        exerciseResults: [
          // Old completed entry (should be ignored because newer draft exists).
          {
            type: EXERCICE_RESULTS_TYPES.MOTIVATION,
            status: 'completed',
            date: { toISO: () => '2026-01-01T10:00:00.000Z' },
            updatedAt: { toISO: () => '2026-01-01T10:00:00.000Z' },
          },
          {
            type: EXERCICE_RESULTS_TYPES.MOTIVATION,
            status: 'draft',
            date: null,
            updatedAt: { toISO: () => '2026-02-01T10:00:00.000Z' },
          },
          {
            type: EXERCICE_RESULTS_TYPES.VALUES,
            status: 'completed',
            date: { toISO: () => '2026-03-01T10:00:00.000Z' },
            updatedAt: { toISO: () => '2026-03-01T10:00:00.000Z' },
          },
        ],
      }),
    } as any

    const controller = new ExerciseResultsController(service, employeeService)
    const ctx = makeCtx()

    await controller.exerciseListCandidat(ctx)

    assert.deepEqual(ctx._inertiaRenderProps().completedExerciseSlugs, [
      EXERCICE_RESULTS_TYPES.VALUES,
    ])
  })
})

test.group('ExerciseResultsController.exerciseListConseiller', () => {
  test('returns unauthorized when no auth user', async ({ assert }) => {
    const service = {} as unknown as ExerciseResultsService
    const controller = new ExerciseResultsController(service, fakeEmployeesService)
    const ctx = makeCtx({ auth: { user: null }, params: { id: 42 } })

    await controller.exerciseListConseiller(ctx)

    assert.isTrue(ctx.response.unauthorizedCalled)
  })
})
