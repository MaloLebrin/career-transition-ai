import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  LegalSection,
  Placeholder,
  Term,
} from '../../../../inertia/components/marketing/LegalSection'

describe('LegalSection', () => {
  test('rend un h2 et son contenu', () => {
    render(
      <LegalSection title="Hébergement">
        <p>Texte de la section</p>
      </LegalSection>
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Hébergement' })).toBeInTheDocument()
    expect(screen.getByText('Texte de la section')).toBeInTheDocument()
  })

  test('accepte des listes à puces réelles', () => {
    render(
      <LegalSection title="Liste">
        <ul className="list-disc space-y-2 pl-5">
          <li>Premier point</li>
          <li>Second point</li>
        </ul>
      </LegalSection>
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('Placeholder', () => {
  test('affiche « [à compléter] » par défaut', () => {
    render(<Placeholder />)
    expect(screen.getByText('[à compléter]')).toBeInTheDocument()
  })

  test('accepte un texte personnalisé', () => {
    render(<Placeholder>[prestataire à compléter]</Placeholder>)
    expect(screen.getByText('[prestataire à compléter]')).toBeInTheDocument()
  })
})

describe('Term', () => {
  test('met en évidence un libellé', () => {
    render(<Term>Dénomination</Term>)
    expect(screen.getByText('Dénomination')).toHaveClass('font-semibold')
  })
})
