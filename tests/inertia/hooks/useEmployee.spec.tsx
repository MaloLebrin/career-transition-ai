import { describe, expect, test } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useEmployee } from '~/hooks/use_employee'
import type { Employee } from '~/types/employee'

const employee = { id: 3, name: 'Camille' } as Employee

describe('useEmployee (déprécié)', () => {
  test('renvoie l’employé initial fourni par Inertia', () => {
    const { result } = renderHook(() => useEmployee(3, employee))
    expect(result.current.employee).toBe(employee)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  test('sans employé initial, ne charge rien (plus d’appel API)', async () => {
    const { result } = renderHook(() => useEmployee(3))
    await act(async () => {
      await result.current.refreshEmployee()
    })
    expect(result.current.employee).toBeNull()
  })

  test('sans identifiant, remet l’employé à null', async () => {
    const { result, rerender } = renderHook(({ id, initial }) => useEmployee(id, initial), {
      initialProps: { id: 3 as number | null, initial: employee as Employee | null },
    })
    expect(result.current.employee).toBe(employee)

    rerender({ id: null, initial: null })
    await act(async () => {})
    expect(result.current.employee).toBeNull()
  })
})
