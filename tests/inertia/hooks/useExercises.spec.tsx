import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useExercises } from '../../../inertia/hooks/useExercises'
import { ExerciseType } from '../../../inertia/types'

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
  id: '1',
  organizationId: '10',
  name: 'Jean',
  email: 'jean@example.com',
  currentRole: 'Dev',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active' as const,
  onboarded: true,
  exercises: [],
  plan: [{ id: 's1', title: 'Step', description: '', dueDate: '', completed: false, associatedExercise: ExerciseType.MOTIVATION }],
}

describe('useExercises', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.mocked(apiService.fetchExerciseDraft).mockResolvedValue(null)
    vi.mocked(apiService.saveExerciseDraft).mockResolvedValue(undefined)
    vi.mocked(apiService.saveExerciseResult).mockResolvedValue(undefined)
    vi.mocked(analyzeExerciseResult).mockResolvedValue('Analysis text')
    onComplete.mockReset()
  })

  test('returns loadDraft that fetches draft when employee present', async () => {
    const draft = { employeeId: '1', type: ExerciseType.MOTIVATION, lastUpdated: '', data: {} }
    vi.mocked(apiService.fetchExerciseDraft).mockResolvedValue(draft as any)

    const { result } = renderHook(() =>
      useExercises(mockEmployee as any, onComplete)
    )

    const loaded = await result.current.loadDraft(ExerciseType.MOTIVATION)
    expect(loaded).toEqual(draft)
    expect(apiService.fetchExerciseDraft).toHaveBeenCalledWith('1', ExerciseType.MOTIVATION)
  })

  test('loadDraft returns null when no employee', async () => {
    vi.mocked(apiService.fetchExerciseDraft).mockClear()
    const { result } = renderHook(() => useExercises(null, onComplete))

    const loaded = await result.current.loadDraft(ExerciseType.MOTIVATION)
    expect(loaded).toBe(null)
    expect(apiService.fetchExerciseDraft).not.toHaveBeenCalled()
  })

  test('saveDraft calls apiService and sets isSavingDraft', async () => {
    const { result } = renderHook(() =>
      useExercises(mockEmployee as any, onComplete)
    )

    await act(async () => {
      result.current.saveDraft(ExerciseType.VALUES, { foo: 'bar' })
    })

    expect(apiService.saveExerciseDraft).toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.isSavingDraft).toBe(false)
    })
  })

  test('saveResult calls analyzeExerciseResult and saveExerciseResult then onComplete', async () => {
    const { result } = renderHook(() =>
      useExercises(mockEmployee as any, onComplete)
    )

    await act(async () => {
      await result.current.saveResult(ExerciseType.MOTIVATION, { data: 'x' }, 10, 60)
    })

    expect(analyzeExerciseResult).toHaveBeenCalledWith(ExerciseType.MOTIVATION, { data: 'x' })
    expect(apiService.saveExerciseResult).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ type: ExerciseType.MOTIVATION, duration: 60 }),
      expect.any(Array)
    )
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
