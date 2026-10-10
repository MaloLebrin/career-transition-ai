import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FaqAccordion } from '../../../../inertia/components/marketing/FaqAccordion'

describe('FaqAccordion', () => {
  test('renders every question closed, opens one on click', async () => {
    const user = userEvent.setup()
    render(
      <FaqAccordion
        items={[
          { question: 'Première ?', answer: 'Réponse une' },
          { question: 'Seconde ?', answer: 'Réponse deux' },
        ]}
      />
    )
    const first = screen.getByText('Première ?').closest('details') as HTMLDetailsElement
    expect(first.open).toBe(false)
    expect(screen.getByText('Réponse deux')).toBeInTheDocument()

    await user.click(screen.getByText('Première ?'))
    expect(first.open).toBe(true)
  })
})
