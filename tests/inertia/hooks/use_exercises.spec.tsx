import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { inertiaPost, useExercises } from '../../../inertia/hooks/use_exercises'
import { ExerciseType } from '../../../inertia/types'

type Outcome = 'success' | 'error' | 'cancelled'

const routerPost = vi.fn()
let nextOutcome: Outcome = 'success'

vi.mock('@inertiajs/react', () => ({
  router: {
    post: (url: string, data: unknown, options: any = {}) => {
      routerPost(url, data, options)
      if (nextOutcome === 'success') options.onSuccess?.({})
      if (nextOutcome === 'error') options.onError?.({ data: 'invalide' })
      // Annulée / interrompue par une autre visite : ni onSuccess ni onError, seulement onFinish.
      options.onFinish?.({})
    },
  },
}))

const employee = {
  id: 1,
  organizationId: 10,
  name: 'Jean',
  email: 'jean@example.com',
  currentRole: 'Dev',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active' as const,
  onboarded: true,
  exercises: [],
  plan: [
    {
      id: 1,
      title: 'Step',
      description: '',
      dueDate: '',
      completed: false,
      associatedExercises: [ExerciseType.DISC],
    },
  ],
} as any

const CANDIDATE_BASE = '/dashboard/candidat/exercises'
const ADVISOR_BASE = '/dashboard/conseiller/employees/1/exercises'

describe('inertiaPost (#170)', () => {
  beforeEach(() => {
    routerPost.mockClear()
    nextOutcome = 'success'
  })

  test('résout « success » et relaie les callbacks', async () => {
    const onSuccess = vi.fn()
    const onFinish = vi.fn()
    await expect(inertiaPost('/x', {}, { onSuccess, onFinish })).resolves.toEqual({
      status: 'success',
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onFinish).toHaveBeenCalled()
  })

  test('résout « error » avec les erreurs de validation', async () => {
    nextOutcome = 'error'
    await expect(inertiaPost('/x', {})).resolves.toEqual({
      status: 'error',
      errors: { data: 'invalide' },
    })
  })

  test('une visite annulée résout la promesse au lieu de la laisser en attente', async () => {
    nextOutcome = 'cancelled'
    await expect(inertiaPost('/x', {})).resolves.toEqual({ status: 'cancelled' })
  })
})

describe('useExercises (#170)', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    routerPost.mockClear()
    onComplete.mockReset()
    nextOutcome = 'success'
  })

  test.each([CANDIDATE_BASE, ADVISOR_BASE])(
    'saveDraft envoie une visite asynchrone sur %s',
    async (basePath) => {
      const { result } = renderHook(() => useExercises({ employee, basePath, onComplete }))

      await act(async () => {
        await result.current.saveDraft(ExerciseType.DISC, { foo: 'bar' })
      })

      expect(routerPost).toHaveBeenCalledWith(
        `${basePath}/disc/draft`,
        expect.objectContaining({ type: ExerciseType.DISC, employeeId: '1', data: { foo: 'bar' } }),
        expect.objectContaining({ async: true, preserveState: true, preserveScroll: true })
      )
      expect(result.current.isSavingDraft).toBe(false)
    }
  )

  test('saveDraft ne fait rien sans candidat', async () => {
    const { result } = renderHook(() =>
      useExercises({ employee: null, basePath: CANDIDATE_BASE, onComplete })
    )
    await act(async () => {
      await result.current.saveDraft(ExerciseType.DISC, {})
    })
    expect(routerPost).not.toHaveBeenCalled()
  })

  test('saveResult envoie le résultat (visite synchrone) puis onComplete', async () => {
    const { result } = renderHook(() =>
      useExercises({ employee, basePath: CANDIDATE_BASE, onComplete })
    )

    await act(async () => {
      await result.current.saveResult(ExerciseType.DISC, { D: 10 }, 10, 60)
    })

    const [url, data, options] = routerPost.mock.calls[0]
    expect(url).toBe(`${CANDIDATE_BASE}/disc/result`)
    expect(data).toEqual(
      expect.objectContaining({
        type: ExerciseType.DISC,
        status: 'completed',
        duration: 60,
        quantitativeScore: 10,
        data: { D: 10 },
        plan: [expect.objectContaining({ id: 1, completed: true })],
      })
    )
    expect(options.async).toBeUndefined()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.isAnalyzing).toBe(false)
  })

  test.each<Outcome>(['error', 'cancelled'])(
    'saveResult %s : pas de onComplete et l’écran d’attente se ferme',
    async (outcome) => {
      nextOutcome = outcome
      const { result } = renderHook(() =>
        useExercises({ employee, basePath: CANDIDATE_BASE, onComplete })
      )

      await act(async () => {
        await result.current.saveResult(ExerciseType.DISC, {}, 10, 60)
      })

      expect(onComplete).not.toHaveBeenCalled()
      await waitFor(() => expect(result.current.isAnalyzing).toBe(false))
    }
  )
})
