import { APP_NAME } from '#shared/constants/app'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import Logo from '../../../inertia/components/ui/Logo'

describe('Logo', () => {
  test('exposes APP_NAME as accessible name and renders the jumpUjob wordmark', () => {
    const { container } = render(<Logo />)

    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
    const wordmark = screen.getByTestId('logo-wordmark')
    expect(wordmark).toHaveTextContent(APP_NAME)
    expect(wordmark).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('img')).toBeNull()
  })

  test('colours the U of the name in coral', () => {
    render(<Logo />)

    const accent = screen.getByTestId('logo-wordmark').querySelector('.text-coral')
    expect(accent).toHaveTextContent(/^U$/)
  })

  test('draws the pebble on its diving board from md upwards', () => {
    const { container } = render(<Logo size="lg" />)

    const mark = container.querySelector('[data-logo-mark="full"]')
    expect(mark).not.toBeNull()
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark).toHaveAttribute('height', '52')
  })

  test('switches to the round badge at small sizes (≤ 32 px)', () => {
    const { container } = render(<Logo size="sm" showText={false} />)

    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
    expect(screen.queryByTestId('logo-wordmark')).not.toBeInTheDocument()
    expect(container.querySelector('[data-logo-mark="badge"]')).toHaveAttribute('width', '28')
    expect(container.querySelector('[data-logo-mark="full"]')).toBeNull()
  })

  test('uses the inverse wordmark colour and a light diving board on dark surfaces', () => {
    const { container } = render(<Logo tone="inverse" />)

    expect(screen.getByTestId('logo-wordmark')).toHaveClass('text-on-ink')
    expect(container.querySelector('[data-logo-mark="full"] path')).toHaveAttribute(
      'stroke',
      'var(--color-on-ink-soft)'
    )
  })
})
