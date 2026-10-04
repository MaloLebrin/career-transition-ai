import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TargetingResultView from '../../../../../inertia/components/exercises/results/TargetingResultView'

describe('TargetingResultView', () => {
  test('renders without crashing with empty targets', () => {
    expect(() => render(<TargetingResultView targets={[]} />)).not.toThrow()
    expect(screen.getByText('Aucune cible enregistrée.')).toBeInTheDocument()
  })

  test('renders targets with name and type', () => {
    const targets = [
      { id: 1, name: 'AFPA', type: 'Formation' },
      { id: 2, name: 'Pôle Emploi', type: 'Emploi' },
    ]
    render(<TargetingResultView targets={targets} />)

    expect(screen.getByText('AFPA')).toBeInTheDocument()
    expect(screen.getByText('Formation')).toBeInTheDocument()
    expect(screen.getByText('Pôle Emploi')).toBeInTheDocument()
    expect(screen.getByText('Emploi')).toBeInTheDocument()
  })

  test('renders target comment', () => {
    const targets = [{ id: 1, name: 'Organisme', type: 'Type', comment: 'Mon commentaire' }]
    render(<TargetingResultView targets={targets} />)

    expect(screen.getByText('"Mon commentaire"')).toBeInTheDocument()
  })

  test('renders advisor comment when present', () => {
    const targets = [
      {
        id: 1,
        name: 'Cible',
        type: 'Formation',
        advisorComment: 'Recommandation du conseiller',
      },
    ]
    render(<TargetingResultView targets={targets} />)

    expect(screen.getByText('Note accompagnateur')).toBeInTheDocument()
    expect(screen.getByText('Recommandation du conseiller')).toBeInTheDocument()
  })

  test('displays header text', () => {
    render(<TargetingResultView targets={[]} />)

    expect(screen.getByText("Organismes de formation ou d'emploi ciblés")).toBeInTheDocument()
  })
})
