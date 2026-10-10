import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return { ...actual, useReducedMotion: vi.fn(() => true), useInView: vi.fn(() => true) }
})

const motion = await import('motion/react')
const { useMockupStep } = await import('../../../inertia/hooks/use_mockup_step')

describe('useMockupStep', () => {
  afterEach(() => vi.useRealTimers())

  test('reduced motion: jumps to the final step', () => {
    const { result } = renderHook(() => useMockupStep(4))
    expect(result.current.step).toBe(4)
    expect(result.current.animated).toBe(false)
  })

  test('animated: advances while in view, pauses on the last step, then loops', () => {
    vi.mocked(motion.useReducedMotion).mockReturnValue(false)
    vi.useFakeTimers()
    const { result } = renderHook(() => useMockupStep(2, 100))
    expect(result.current.step).toBe(0)

    act(() => vi.advanceTimersByTime(100))
    expect(result.current.step).toBe(1)
    act(() => vi.advanceTimersByTime(300))
    expect(result.current.step).toBe(2)
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.step).toBe(0)
  })
})
