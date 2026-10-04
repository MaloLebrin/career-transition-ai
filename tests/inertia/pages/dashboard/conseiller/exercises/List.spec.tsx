import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ConseillerExerciseList from '~/pages/dashboard/conseiller/exercises/List'
import { resetInertiaMock } from '../../../../support/inertia_mock'

const { layoutProps } = vi.hoisted(() => ({
  layoutProps: [] as Array<{ hideSidebar?: boolean; selectedEmployeeId?: string | null }>,
}))

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})
vi.mock('~/components/dashboard/DashboardLayout', () => ({
  default: ({
    children,
    hideSidebar,
    selectedEmployeeId,
  }: {
    children: React.ReactNode
    hideSidebar?: boolean
    selectedEmployeeId?: string | null
  }) => {
    layoutProps.push({ hideSidebar, selectedEmployeeId })
    return <div>{children}</div>
  },
}))

describe('Liste des résultats d’exercices (conseiller)', () => {
  beforeEach(() => {
    resetInertiaMock()
    layoutProps.length = 0
  })

  test('conserve le menu latéral (pas de hideSidebar)', () => {
    render(<ConseillerExerciseList employeeId="5" results={[]} />)
    expect(layoutProps.at(-1)?.hideSidebar).toBeFalsy()
    expect(layoutProps.at(-1)?.selectedEmployeeId).toBe('5')
  })

  test('état vide et lien retour vers la fiche', () => {
    render(<ConseillerExerciseList employeeId="5" results={[]} />)
    expect(screen.getByText(/Aucun exercice réalisé/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Retour' })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/5'
    )
  })

  test('liste les résultats avec statut et date formatée', () => {
    render(
      <ConseillerExerciseList
        employeeId="5"
        results={[
          { slug: 'values', title: 'Valeurs', date: '2024-03-15', status: 'completed' },
          { slug: 'disc', title: 'DISC', date: 'n/a', status: 'draft' },
          { slug: 'targeting', title: 'Ciblage', date: '', status: 'draft' },
        ]}
      />
    )
    expect(screen.getByRole('link', { name: /Valeurs/ })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/5/exercises/results/values'
    )
    expect(screen.getByText('Complété le 15 mars 2024')).toBeInTheDocument()
    expect(screen.getByText('Brouillon le n/a')).toBeInTheDocument()
    expect(screen.getByText('Brouillon le —')).toBeInTheDocument()
  })
})
