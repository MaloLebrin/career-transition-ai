import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillMappingResultView from '../../../../../inertia/components/exercises/results/SkillMappingResultView'

describe('SkillMappingResultView', () => {
  test('renders without crashing with empty mapping', () => {
    expect(() =>
      render(<SkillMappingResultView jobTitle="Développeur" mapping={[]} />)
    ).not.toThrow()
    expect(screen.getByText('Développeur')).toBeInTheDocument()
    expect(screen.getByText('Poste analysé')).toBeInTheDocument()
  })

  test('renders job title and mapping rows', () => {
    const mapping = [
      { mission: 'Développement', activity: 'Coder', proof: 'Projet A' },
      { mission: 'Revue', activity: 'Code review', proof: 'PR validées' },
    ]
    render(<SkillMappingResultView jobTitle="Tech Lead" mapping={mapping} />)

    expect(screen.getByText('Tech Lead')).toBeInTheDocument()
    expect(screen.getByText('Développement')).toBeInTheDocument()
    expect(screen.getByText('Coder')).toBeInTheDocument()
    expect(screen.getByText('"Projet A"')).toBeInTheDocument()
    expect(screen.getByText('Revue')).toBeInTheDocument()
  })

  test('displays "Non documenté" when proof is missing', () => {
    const mapping = [{ mission: 'Mission', activity: 'Activité' }]
    render(<SkillMappingResultView jobTitle="Poste" mapping={mapping} />)

    expect(screen.getByText('"Non documenté"')).toBeInTheDocument()
  })

  test('renders table headers', () => {
    render(<SkillMappingResultView jobTitle="Test" mapping={[]} />)

    expect(screen.getByText('Mission')).toBeInTheDocument()
    expect(screen.getByText('Activité')).toBeInTheDocument()
    expect(screen.getByText('Preuve / Réalisation')).toBeInTheDocument()
  })
})
