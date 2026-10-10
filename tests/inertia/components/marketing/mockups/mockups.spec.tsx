import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { AiAnalysisMockup } from '../../../../../inertia/components/marketing/mockups/AiAnalysisMockup'
import { ExpertMockup } from '../../../../../inertia/components/marketing/mockups/ExpertMockup'
import { JourneyMockup } from '../../../../../inertia/components/marketing/mockups/JourneyMockup'
import { MockupFrame } from '../../../../../inertia/components/marketing/mockups/MockupFrame'
import { SynthesisMockup } from '../../../../../inertia/components/marketing/mockups/SynthesisMockup'

describe('live mockups (reduced motion: final state)', () => {
  test('MockupFrame labels the mockup as illustrative and hides its content', () => {
    render(
      <MockupFrame title="Fenêtre">
        <p>Contenu</p>
      </MockupFrame>
    )
    expect(screen.getByRole('figure')).toHaveTextContent('Aperçu illustratif')
    expect(screen.getByText('Contenu').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test('JourneyMockup lists real exercises, all completed, then the synthesis', () => {
    render(<JourneyMockup />)
    expect(screen.getByText(EXERCISE_LIST[0].title)).toBeInTheDocument()
    expect(screen.getByTestId('journey-progress')).toHaveTextContent('5 / 5 terminés')
    expect(screen.getByText('Synthèse de parcours')).toBeInTheDocument()
  })

  test('AiAnalysisMockup shows the themes and, for cabinets, the advisor review', () => {
    const { unmount } = render(<AiAnalysisMockup />)
    expect(screen.getByText('Autonomie')).toBeInTheDocument()
    expect(screen.queryByText(/validée par votre conseiller/)).not.toBeInTheDocument()
    unmount()

    render(<AiAnalysisMockup reviewed />)
    expect(screen.getByText(/validée par votre conseiller/)).toBeInTheDocument()
  })

  test('SynthesisMockup and ExpertMockup render their final state', () => {
    render(
      <>
        <SynthesisMockup />
        <ExpertMockup />
      </>
    )
    expect(screen.getByText('synthese-parcours.pdf')).toBeInTheDocument()
    expect(screen.getByText(/premier échange/)).toBeInTheDocument()
  })
})
