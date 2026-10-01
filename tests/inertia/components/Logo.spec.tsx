import { APP_NAME } from '#shared/constants/app'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import Logo from '../../../inertia/components/ui/Logo'

describe('Logo', () => {
  test('renders the mark and the wordmark by default', () => {
    render(<Logo />)

    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
    expect(screen.queryByText('FTC')).not.toBeInTheDocument()
  })

  test('renders icon-only when showText is false', () => {
    render(<Logo size="sm" showText={false} />)

    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
    expect(screen.queryByText(APP_NAME)).not.toBeInTheDocument()
  })

  test('uses the inverse wordmark colour on dark surfaces', () => {
    render(<Logo tone="inverse" />)

    expect(screen.getByText(APP_NAME)).toHaveClass('text-on-ink')
  })
})
