import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../../../../inertia/components/ui/StatCard'

describe('StatCard', () => {
  test('renders label and value', () => {
    render(<StatCard label="Total" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  test('uses article and aria-label for accessibility', () => {
    render(<StatCard label="Utilisateurs" value={100} />)
    const article = screen.getByRole('article', { name: '100 Utilisateurs' })
    expect(article).toBeInTheDocument()
  })

  test('applies color variant', () => {
    const { container } = render(<StatCard label="X" value="99%" color="sage" />)
    const article = container.querySelector('article')
    expect(article?.querySelector('[class*="bg-brand-sage"]')).toBeInTheDocument()
  })
})
