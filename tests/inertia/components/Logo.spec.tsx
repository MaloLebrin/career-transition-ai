import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '../../../inertia/components/ui/Logo'

describe('Logo', () => {
  test('renders full logo with alt text by default', () => {
    render(<Logo />)

    const img = screen.getByAltText('France Transition Carrière')
    expect(img).toBeInTheDocument()
    // Height is controlled via inline style from size map
    expect((img as HTMLImageElement).style.height).toBe('40px')
  })

  test('renders small icon-only logo when showText is false and size is sm', () => {
    render(<Logo size="sm" showText={false} />)

    const img = screen.getByAltText('France Transition Carrière')
    expect(img).toBeInTheDocument()
    expect((img as HTMLImageElement).style.height).toBe('28px')
  })
})

