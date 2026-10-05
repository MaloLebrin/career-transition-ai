import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { CandidateSidebar } from '../../../../inertia/components/dashboard/CandidateSidebar'

vi.mock('@inertiajs/react', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePage: () => ({ url: '/dashboard/candidat/chat' }),
}))

describe('CandidateSidebar', () => {
  test('liste les pages du candidat dont le chat', () => {
    render(<CandidateSidebar />)

    expect(screen.getByRole('navigation', { name: 'Navigation candidat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Discuter avec un expert/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/chat'
    )
    expect(screen.getByRole('link', { name: /Mon espace/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat'
    )
  })
})
