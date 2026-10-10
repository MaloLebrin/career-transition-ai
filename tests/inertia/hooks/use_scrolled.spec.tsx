import { afterEach, describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useScrolled } from '../../../inertia/hooks/use_scrolled'

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('useScrolled', () => {
  afterEach(() => Object.defineProperty(window, 'scrollY', { value: 0, configurable: true }))

  test('flips once the page scrolls past the threshold', () => {
    const { result } = renderHook(() => useScrolled(40))
    expect(result.current).toBe(false)

    scrollTo(30)
    expect(result.current).toBe(false)
    scrollTo(41)
    expect(result.current).toBe(true)
    scrollTo(0)
    expect(result.current).toBe(false)
  })
})
