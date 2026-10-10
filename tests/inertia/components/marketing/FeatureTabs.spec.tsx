import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Gift, Sparkles } from 'lucide-react'
import { FeatureTabs } from '../../../../inertia/components/marketing/FeatureTabs'

const TABS = [
  {
    label: 'Premier',
    icon: Gift,
    tint: 'sun' as const,
    title: 'Titre un',
    description: 'Description un',
    points: ['Point A'],
    visual: <p>Visuel un</p>,
  },
  {
    label: 'Second',
    icon: Sparkles,
    tint: 'lake' as const,
    title: 'Titre deux',
    description: 'Description deux',
    visual: <p>Visuel deux</p>,
  },
]

describe('FeatureTabs', () => {
  test('shows the first tab, switches on click and with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<FeatureTabs tabs={TABS} />)

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Visuel un')
    expect(screen.getByRole('heading', { name: 'Titre un' })).toBeInTheDocument()
    expect(screen.getByText('Point A')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Second/ }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Visuel deux')

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('tab', { name: /Premier/ })).toHaveAttribute('aria-selected', 'true')
  })
})
