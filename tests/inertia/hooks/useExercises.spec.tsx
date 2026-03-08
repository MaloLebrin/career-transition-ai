import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useExercises } from '../../../inertia/hooks/useExercises'
import { ExerciseType } from '../../../inertia/types'

const mockRouterPost = vi.fn().mockResolvedValue(undefined)
vi.mock('@inertiajs/react', () => ({
  router: { post: (...args: unknown[]) => mockRouterPost(...args) },
}))

vi.mock('../../../inertia/services/apiService', () => ({
  apiService: {
    fetchExerciseDraft: vi.fn(),
    saveExerciseDraft: vi.fn(),
    saveExerciseResult: vi.fn(),
  },
}))

vi.mock('../../../inertia/services/geminiService', () => ({
  analyzeExerciseResult: vi.fn(),
}))

const { apiService } = await import('../../../inertia/services/apiService')
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
      associatedExercise: ExerciseType.MOTIVATION,
    },
  ],
}

describe('useExercises', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.mocked(apiService.fetchExerciseDraft).mockResolvedValue(null)
    vi.mocked(apiService.saveExerciseDraft).mockResolvedValue(undefined)
    vi.mocked(apiService.saveExerciseResult).mockResolvedValue(undefined)
    vi.mocked(analyzeExerciseResult).mockResolvedValue('Analysis text')
    mockRouterPost.mockClear().mockResolvedValue(undefined)
    onComplete.mockReset()
  })

  test('returns loadDraft that fetches draft when employee present', async () => {
    const draft = { employeeId: '1', type: ExerciseType.MOTIVATION, lastUpdated: '', data: {} }
    vi.mocked(apiService.fetchExerciseDraft).mockResolvedValue(draft as any)

    const { result } = renderHook(() => useExercises(mockEmployee as any, onComplete))

    const loaded = await result.current.loadDraft(ExerciseType.MOTIVATION)
    expect(loaded).toEqual(draft)
    expect(apiService.fetchExerciseDraft).toHaveBeenCalledWith(1, ExerciseType.MOTIVATION)
  })

  test('loadDraft returns null when no employee', async () => {
    vi.mocked(apiService.fetchExerciseDraft).mockClear()
    const { result } = renderHook(() => useExercises(null, onComplete))

    const loaded = await result.current.loadDraft(ExerciseType.MOTIVATION)
    expect(loaded).toBe(null)
    expect(apiService.fetchExerciseDraft).not.toHaveBeenCalled()
  })

  test('saveDraft uses Inertia router.post for DISC and sets isSavingDraft', async () => {
    const { result } = renderHook(() => useExercises(mockEmployee as any, onComplete))

    await act(async () => {
      result.current.saveDraft(ExerciseType.DISC, { foo: 'bar' })
    })

    expect(mockRouterPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/1/exercises/disc/draft',
      expect.objectContaining({ type: ExerciseType.DISC, data: { foo: 'bar' } }),
      expect.any(Object)
    )
    expect(apiService.saveExerciseDraft).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.isSavingDraft).toBe(false)
    })
  })

  test('saveResult uses Inertia router.post for DISC then onComplete', async () => {
    const { result } = renderHook(() => useExercises(mockEmployee as any, onComplete))

    await act(async () => {
      await result.current.saveResult(ExerciseType.DISC, { data: 'x' }, 10, 60)
    })

    expect(analyzeExerciseResult).toHaveBeenCalledWith(ExerciseType.DISC, { data: 'x' })
    expect(mockRouterPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/1/exercises/disc/result',
      expect.objectContaining({ type: ExerciseType.DISC, status: 'completed' })
    )
    expect(apiService.saveExerciseResult).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalled()
  })

  test('saveResult does nothing when employee is null', async () => {
    vi.mocked(apiService.saveExerciseResult).mockClear()
    onComplete.mockClear()
    const { result } = renderHook(() => useExercises(null, onComplete))

    await act(async () => {
      await result.current.saveResult(ExerciseType.MOTIVATION, {}, 10, 60)
    })

    expect(apiService.saveExerciseResult).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
