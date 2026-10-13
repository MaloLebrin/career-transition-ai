import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SEARCH_DEBOUNCE_MS, useServerList } from '../../../inertia/hooks/use_server_list'
import { resetInertiaMock, routerSpies } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

const ONLY = ['employees']
const INITIAL = { search: '', status: 'all' }

describe('useServerList', () => {
  beforeEach(() => {
    resetInertiaMock()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('la recherche met à jour le champ tout de suite et part au serveur après le délai', () => {
    const { result } = renderHook(() => useServerList('/liste', INITIAL, ONLY))

    act(() => result.current.setSearch('jea'))
    act(() => result.current.setSearch('jean'))

    expect(result.current.values.search).toBe('jean')
    expect(routerSpies.get).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(routerSpies.get).toHaveBeenCalledTimes(1)
    expect(routerSpies.get).toHaveBeenCalledWith(
      '/liste',
      { search: 'jean' },
      expect.objectContaining({
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: ['employees', 'pagination', 'filters'],
      })
    )
  })

  test('un filtre part immédiatement, en gardant la recherche, et omet la valeur « all »', () => {
    const { result } = renderHook(() => useServerList('/liste', INITIAL, ONLY))

    act(() => result.current.setFilter('status', 'active'))
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/liste',
      { status: 'active' },
      expect.anything()
    )

    act(() => result.current.setFilter('status', 'all'))
    expect(routerSpies.get).toHaveBeenLastCalledWith('/liste', {}, expect.anything())
  })

  test('un filtre texte peut être différé comme la recherche', () => {
    const { result } = renderHook(() => useServerList('/liste', INITIAL, ONLY))

    act(() => result.current.setFilter('status', '12', true))
    expect(routerSpies.get).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })
    expect(routerSpies.get).toHaveBeenCalledWith('/liste', { status: '12' }, expect.anything())
  })

  test('changer de page garde les filtres ; la page 1 est omise', () => {
    const { result } = renderHook(() =>
      useServerList('/liste', { search: 'marie', status: 'active' }, ONLY)
    )

    act(() => result.current.goToPage(3))
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/liste',
      { search: 'marie', status: 'active', page: '3' },
      expect.anything()
    )

    act(() => result.current.goToPage(1))
    expect(routerSpies.get).toHaveBeenLastCalledWith(
      '/liste',
      { search: 'marie', status: 'active' },
      expect.anything()
    )
  })

  test('une recherche en attente est annulée au démontage', () => {
    const { result, unmount } = renderHook(() => useServerList('/liste', INITIAL, ONLY))

    act(() => result.current.setSearch('x'))
    unmount()
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(routerSpies.get).not.toHaveBeenCalled()
  })
})
