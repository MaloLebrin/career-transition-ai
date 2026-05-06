import { APP_NAME } from '#shared/constants/app'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import Logo from '../../../inertia/components/ui/Logo'

describe('Logo', () => {
  test('renders full logo with text by default', () => {
    render(<Logo />)

    expect(screen.getByLabelText(APP_NAME)).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
    expect(screen.getByText('FTC')).toBeInTheDocument()
  })

  test('renders icon-only when showText is false', () => {
    render(<Logo size="sm" showText={false} />)

    expect(screen.getByLabelText(APP_NAME)).toBeInTheDocument()
    expect(screen.queryByText(APP_NAME)).not.toBeInTheDocument()
    expect(screen.getByText('FTC')).toBeInTheDocument()
  })
})
