import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useExerciseTimer } from '../../../inertia/hooks/use_exercise_timer'

describe('useExerciseTimer (#170)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-28T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('compte les secondes entières depuis le montage', () => {
    const { result } = renderHook(() => useExerciseTimer())
    vi.advanceTimersByTime(90_900)
    expect(result.current.elapsedSeconds()).toBe(90)
  })

  test('restart() repart de zéro', () => {
    const { result } = renderHook(() => useExerciseTimer())
    vi.advanceTimersByTime(60_000)
    act(() => result.current.restart())
    vi.advanceTimersByTime(5_000)
    expect(result.current.elapsedSeconds()).toBe(5)
  })

  test('autoStart: false renvoie 0 tant que le chronomètre n’a pas démarré', () => {
    const { result } = renderHook(() => useExerciseTimer({ autoStart: false }))
    vi.advanceTimersByTime(60_000)
    expect(result.current.elapsedSeconds()).toBe(0)
    act(() => result.current.restart())
    vi.advanceTimersByTime(3_000)
    expect(result.current.elapsedSeconds()).toBe(3)
  })

  test('garde le même départ entre deux rendus', () => {
    const { result, rerender } = renderHook(() => useExerciseTimer())
    vi.advanceTimersByTime(10_000)
    rerender()
    expect(result.current.elapsedSeconds()).toBe(10)
  })
})
