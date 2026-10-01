import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLink from '../../../../inertia/components/ui/AppLink'

vi.mock('@inertiajs/react', () => ({
  Link: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string
    className?: string
    children: React.ReactNode
  }) => (
    <a href={href} className={className} data-inertia-link="true" {...rest}>
      {children}
    </a>
  ),
}))

describe('AppLink', () => {
  test('renders internal link via Inertia Link with cursor-pointer', () => {
    render(<AppLink href="/dashboard">Tableau de bord</AppLink>)
    const link = screen.getByRole('link', { name: 'Tableau de bord' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveAttribute('data-inertia-link', 'true')
    expect(link).toHaveClass('cursor-pointer')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  test('renders external https link as native anchor with target and rel', () => {
    render(<AppLink href="https://example.com">Exemple</AppLink>)
    const link = screen.getByRole('link', { name: 'Exemple' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveClass('cursor-pointer')
    expect(link.tagName).toBe('A')
  })

  test('renders external http link as native anchor', () => {
    render(<AppLink href="http://example.com">HTTP</AppLink>)
    const link = screen.getByRole('link', { name: 'HTTP' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('prop external=true forces native anchor for relative href', () => {
    render(
      <AppLink href="/some-page" external>
        Forcé externe
      </AppLink>
    )
    const link = screen.getByRole('link', { name: 'Forcé externe' })
    expect(link).toHaveAttribute('href', '/some-page')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).not.toHaveAttribute('data-inertia-link')
  })

  test('merges custom className and always includes cursor-pointer', () => {
    render(
      <AppLink href="/profile" className="text-accent font-bold">
        Profil
      </AppLink>
    )
    const link = screen.getByRole('link', { name: 'Profil' })
    expect(link).toHaveClass('cursor-pointer')
    expect(link).toHaveClass('text-accent')
    expect(link).toHaveClass('font-bold')
  })

  test('does not duplicate cursor-pointer when already in className', () => {
    render(
      <AppLink href="/page" className="cursor-pointer custom">
        Link
      </AppLink>
    )
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toHaveClass('cursor-pointer')
    expect(link).toHaveClass('custom')
  })

  test('renders children correctly', () => {
    render(
      <AppLink href="https://docs.example.com">
        <span data-testid="inner">Documentation</span>
      </AppLink>
    )
    expect(screen.getByTestId('inner')).toHaveTextContent('Documentation')
  })
})
