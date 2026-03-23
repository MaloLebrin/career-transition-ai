import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAdvisorExercises } from '../../../inertia/hooks/use_advisor_exercises'
import { ExerciseType } from '../../../inertia/types'

const mockRouterPost = vi.fn().mockResolvedValue(undefined)
vi.mock('@inertiajs/react', () => ({
  router: { post: (...args: unknown[]) => mockRouterPost(...args) },
}))

vi.mock('../../../inertia/services/geminiService', () => ({
  analyzeExerciseResult: vi.fn(),
}))

const { analyzeExerciseResult } = await import('../../../inertia/services/geminiService')

const mockEmployee = {
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
      associatedExercises: [ExerciseType.MOTIVATION],
    },
  ],
}

describe('useAdvisorExercises', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.mocked(analyzeExerciseResult).mockResolvedValue('Analysis text')
    mockRouterPost.mockClear().mockResolvedValue(undefined)
    onComplete.mockReset()
  })

  test('returns initial draft when provided in options', async () => {
    const draft = { employeeId: 1, type: ExerciseType.MOTIVATION, lastUpdated: '', data: {} }
    const { result } = renderHook(() =>
      useAdvisorExercises(mockEmployee as any, onComplete, {
        motivation: { initialDraft: draft as any },
      })
    )

    const loaded = await result.current.loadDraft(ExerciseType.MOTIVATION)
    expect(loaded).toEqual(draft)
  })

  test('saveDraft posts to advisor endpoint by default', async () => {
    const { result } = renderHook(() => useAdvisorExercises(mockEmployee as any, onComplete))

    await act(async () => {
      result.current.saveDraft(ExerciseType.DISC, { foo: 'bar' })
    })

    expect(mockRouterPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/1/exercises/disc/draft',
      expect.objectContaining({ type: ExerciseType.DISC, data: { foo: 'bar' } }),
      expect.any(Object)
    )
    await waitFor(() => {
      expect(result.current.isSavingDraft).toBe(false)
    })
  })

  test('saveResult posts to advisor endpoint then onComplete', async () => {
    const { result } = renderHook(() => useAdvisorExercises(mockEmployee as any, onComplete))

    await act(async () => {
      await result.current.saveResult(ExerciseType.DISC, { data: 'x' }, 10, 60)
    })

    expect(analyzeExerciseResult).toHaveBeenCalledWith(ExerciseType.DISC, { data: 'x' })
    expect(mockRouterPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/1/exercises/disc/result',
      expect.objectContaining({ type: ExerciseType.DISC, status: 'completed' })
    )
    expect(onComplete).toHaveBeenCalled()
  })
})
