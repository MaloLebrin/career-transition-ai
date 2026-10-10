import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrivacyFlow } from '../../../../inertia/components/marketing/PrivacyFlow'

describe('PrivacyFlow', () => {
  test('shows the three stages of the data before the AI', () => {
    render(<PrivacyFlow />)
    const flow = screen.getByRole('list', { name: 'Parcours de vos données avant l’analyse' })
    expect(flow).toHaveTextContent('Vos réponses')
    expect(flow).toHaveTextContent('Nom et e-mail retirés')
    expect(flow).toHaveTextContent('Analyse IA')
  })
})
