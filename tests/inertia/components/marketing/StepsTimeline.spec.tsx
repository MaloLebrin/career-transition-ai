import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { StepsTimeline } from '../../../../inertia/components/marketing/StepsTimeline'

describe('StepsTimeline', () => {
  test('numbers the steps in order', () => {
    render(
      <StepsTimeline
        steps={[
          { title: 'Créer', description: 'Un compte' },
          { title: 'Avancer', description: 'Les exercices' },
        ]}
      />
    )
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('1Créer')
    expect(items[1]).toHaveTextContent('2Avancer')
  })
})
