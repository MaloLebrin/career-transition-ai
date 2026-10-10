import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeyFactsStrip } from '../../../../inertia/components/marketing/KeyFactsStrip'

describe('KeyFactsStrip', () => {
  test('renders numbers (formatted) and text facts with their labels', () => {
    render(
      <KeyFactsStrip
        label="Faits"
        facts={[
          { value: 8, label: 'exercices' },
          { value: 100, format: (n) => `${n} %`, label: 'hébergé dans l’UE' },
          { value: '49 €', label: 'le forfait' },
        ]}
      />
    )
    const strip = screen.getByRole('region', { name: 'Faits' })
    expect(strip).toHaveTextContent('8exercices')
    expect(strip).toHaveTextContent('100 %hébergé dans l’UE')
    expect(strip).toHaveTextContent('49 €le forfait')
  })
})
