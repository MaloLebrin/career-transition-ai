import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LegalDocument } from '../../../../inertia/components/marketing/LegalDocument'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

beforeEach(() => resetInertiaMock())

describe('LegalDocument', () => {
  test('rend le sur-titre, le h1 et le chapeau', () => {
    render(
      <LegalDocument
        eyebrow="Sur-titre du document"
        title="Mentions légales"
        lead="Chapeau du document."
      >
        <p>Corps</p>
      </LegalDocument>
    )

    expect(screen.getByText('Sur-titre du document')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeInTheDocument()
    expect(screen.getByText('Chapeau du document.')).toBeInTheDocument()
    expect(screen.getByText('Corps')).toBeInTheDocument()
  })

  test('affiche la date de mise à jour seulement si elle est fournie', () => {
    const { rerender } = render(
      <LegalDocument eyebrow="Légal" title="Titre" lead="Chapeau">
        <p>Corps</p>
      </LegalDocument>
    )
    expect(screen.queryByText(/Dernière mise à jour/)).not.toBeInTheDocument()

    rerender(
      <LegalDocument eyebrow="Légal" title="Titre" lead="Chapeau" updatedAt="1er octobre 2026">
        <p>Corps</p>
      </LegalDocument>
    )
    expect(screen.getByText('Dernière mise à jour : 1er octobre 2026')).toBeInTheDocument()
  })

  test('rend le contenu aside avant les sections', () => {
    render(
      <LegalDocument
        eyebrow="Sécurité"
        title="Titre"
        lead="Chapeau"
        aside={<div data-testid="aside">Cartes</div>}
      >
        <section data-testid="section">Section</section>
      </LegalDocument>
    )

    const aside = screen.getByTestId('aside')
    const section = screen.getByTestId('section')
    expect(aside).toBeInTheDocument()
    // L'aside précède les sections dans le document.
    expect(aside.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('monte le layout public (en-tête et pied de page)', () => {
    render(
      <LegalDocument eyebrow="Légal" title="Titre" lead="Chapeau">
        <p>Corps</p>
      </LegalDocument>
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('article')).toBeInTheDocument()
  })
})
