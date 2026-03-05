import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '../../../inertia/components/ui/Logo'

describe('Logo', () => {
  test('renders full logo with text by default', () => {
    render(<Logo />)

    expect(screen.getByLabelText('France Transition Carrière')).toBeInTheDocument()
    expect(screen.getByText('France Transition Carrière')).toBeInTheDocument()
    expect(screen.getByText('FTC')).toBeInTheDocument()
  })

  test('renders icon-only when showText is false', () => {
    render(<Logo size="sm" showText={false} />)

    expect(screen.getByLabelText('France Transition Carrière')).toBeInTheDocument()
    expect(screen.queryByText('France Transition Carrière')).not.toBeInTheDocument()
    expect(screen.getByText('FTC')).toBeInTheDocument()
  })
})

