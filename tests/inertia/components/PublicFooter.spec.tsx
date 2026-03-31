import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PublicFooter from '../../../inertia/components/layout/PublicFooter'

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

describe('PublicFooter', () => {
  test('marketing variant shows Accueil link and calls onEnterApp for Accès Expert', () => {
    const onEnterApp = vi.fn()
    render(
      <PublicFooter
        variant="marketing"
        onEnterApp={onEnterApp}
        footerLine="Test © 2026"
      />
    )

    expect(screen.getByRole('link', { name: /Accueil/i })).toHaveAttribute('href', '/')
    fireEvent.click(screen.getByRole('button', { name: /Accès Expert/i }))
    expect(onEnterApp).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Test © 2026/)).toBeInTheDocument()
  })

  test('landing variant shows Intelligence Artificielle button when onAiClick provided', () => {
    const onAiClick = vi.fn()
    render(
      <PublicFooter
        variant="landing"
        onEnterApp={() => {}}
        onAiClick={onAiClick}
        footerLine="Landing line"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Intelligence Artificielle/i }))
    expect(onAiClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('link', { name: /Accueil/i })).not.toBeInTheDocument()
  })
})
