import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicLayout from '../../../inertia/components/layout/PublicLayout'

describe('PublicLayout', () => {
  test('renders wrapper with base classes and children', () => {
    render(
      <PublicLayout
        headerProps={{
          onLogoClick: () => {},
          onMethodologyClick: () => {},
          onAiClick: () => {},
          onActionClick: () => {},
        }}
      >
        <span data-testid="child">Contenu public</span>
      </PublicLayout>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Contenu public')).toBeInTheDocument()

    const wrapper = screen.getByTestId('child').parentElement
    expect(wrapper).toHaveClass('min-h-screen')
    expect(wrapper).toHaveClass('bg-brand-ivory')
  })

  test('applies optional className to wrapper', () => {
    render(
      <PublicLayout
        headerProps={{ onLogoClick: () => {} }}
        className="flex flex-col"
      >
        <span data-testid="child">Child</span>
      </PublicLayout>
    )

    const wrapper = screen.getByTestId('child').parentElement
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('flex-col')
  })

  test('renders PublicHeader with correct label', () => {
    render(
      <PublicLayout
        headerProps={{
          onLogoClick: () => {},
          actionLabel: 'Accès Expert',
          showAction: true,
          onActionClick: () => {},
        }}
      >
        <span data-testid="child">Child</span>
      </PublicLayout>
    )

    expect(screen.getByRole('button', { name: /Accès Expert/i })).toBeInTheDocument()
  })
})
