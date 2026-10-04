import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ExerciseResultDetail from '~/pages/dashboard/conseiller/exercises/ResultDetail'
import { resetInertiaMock } from '../../../../support/inertia_mock'
import { makeNote } from '../../../../support/factories'

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
vi.mock('~/components/exercises/ExerciseResultVisualization', () => ({
  default: ({ result }: { result: { type: string } }) => <div>Visualisation {result.type}</div>,
}))

const result = {
  id: 33,
  employeeId: 5,
  type: 'values',
  date: '2024-03-15',
  duration: 125,
  data: {},
  quantitativeScore: 10,
  qualitativeAnalysis: 'Profil orienté bienveillance',
}

describe('Détail d’un résultat d’exercice (conseiller)', () => {
  beforeEach(() => {
    resetInertiaMock()
    layoutProps.length = 0
  })

  test('conserve le menu latéral (pas de hideSidebar)', () => {
    render(
      <ExerciseResultDetail
        employeeId="5"
        employeeName="Camille"
        exerciseTitle="Valeurs"
        result={null}
      />
    )
    expect(layoutProps.at(-1)?.hideSidebar).toBeFalsy()
    expect(layoutProps.at(-1)?.selectedEmployeeId).toBe('5')
  })

  test('sans résultat : message dédié et lien retour', () => {
    render(
      <ExerciseResultDetail
        employeeId="5"
        employeeName="Camille"
        exerciseTitle="Valeurs"
        result={null}
      />
    )
    expect(screen.getByText('Aucun résultat enregistré pour cet exercice.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour aux résultats/ })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/5/exercises'
    )
  })

  test('affiche titre, visualisation, analyse IA, date, durée et notes', () => {
    render(
      <ExerciseResultDetail
        employeeId="5"
        employeeName="Camille"
        exerciseTitle="Valeurs"
        result={result as never}
        notes={[makeNote({ content: 'À creuser en séance', exerciseResultId: 33 })]}
      />
    )

    expect(screen.getByRole('heading', { name: 'Valeurs' })).toBeInTheDocument()
    expect(screen.getByText('Résultat de Camille')).toBeInTheDocument()
    expect(screen.getByText('Visualisation values')).toBeInTheDocument()
    expect(screen.getByText(/Profil orienté bienveillance/)).toBeInTheDocument()
    expect(screen.getByText('15 mars 2024')).toBeInTheDocument()
    expect(screen.getByText('2 min 5 s')).toBeInTheDocument()
    expect(screen.getByText('Notes sur cet exercice')).toBeInTheDocument()
    expect(screen.getByText('À creuser en séance')).toBeInTheDocument()
  })

  test('sans analyse ni date valide : section masquée et date brute ou tiret', () => {
    const { unmount } = render(
      <ExerciseResultDetail
        employeeId="5"
        employeeName="Camille"
        exerciseTitle="Valeurs"
        result={{ ...result, qualitativeAnalysis: '', date: 'bientôt' } as never}
      />
    )
    expect(screen.queryByText('Analyse synthétique Gemini')).not.toBeInTheDocument()
    expect(screen.getByText('bientôt')).toBeInTheDocument()
    unmount()

    render(
      <ExerciseResultDetail
        employeeId="5"
        employeeName="Camille"
        exerciseTitle="Valeurs"
        result={{ ...result, date: undefined } as never}
      />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
