import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import DesignSystem from '../../../../inertia/components/design-system/DesignSystem'

describe('DesignSystem (vitrine)', () => {
  test('renders every section of the showcase', () => {
    render(<DesignSystem onBack={() => {}} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Design system' })).toBeInTheDocument()
    for (const title of [
      'Couleurs',
      'Typographie',
      'Boutons',
      'Badges',
      'Champs',
      'Cartes',
      'Illustration',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  test('reads colours from the theme variables and lists the button variants', () => {
    const { container } = render(<DesignSystem onBack={() => {}} />)

    expect(container.querySelector('[data-token="primary"]')).toHaveStyle({
      background: 'var(--color-primary)',
    })
    expect(container.querySelector('[data-token="accent"]')).toHaveStyle({
      background: 'var(--color-accent)',
    })
    expect(container.querySelector('[data-token="tint-lavender-bold"]')).toHaveStyle({
      background: 'var(--color-tint-lavender-bold)',
    })
    expect(screen.getByRole('button', { name: 'primary' })).toHaveClass('bg-primary')
    expect(screen.getByRole('button', { name: 'secondary' })).toHaveClass('bg-sun')
    expect(screen.queryByRole('button', { name: 'cta' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('svg[data-variant]')).toHaveLength(3)
  })

  test('calls onBack', () => {
    const onBack = vi.fn()
    render(<DesignSystem onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retour au bureau' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
