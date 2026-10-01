import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownContent from '../../../../inertia/components/ui/MarkdownContent'

describe('MarkdownContent', () => {
  test('renders plain text as paragraph', () => {
    render(<MarkdownContent>Hello analysis</MarkdownContent>)
    expect(screen.getByText('Hello analysis')).toBeInTheDocument()
  })

  test('renders bold markdown', () => {
    render(<MarkdownContent>**Important** point</MarkdownContent>)
    expect(screen.getByText('Important')).toBeInTheDocument()
    expect(screen.getByText('point')).toBeInTheDocument()
    const strong = document.querySelector('strong')
    expect(strong).toHaveTextContent('Important')
  })

  test('renders list items', () => {
    render(<MarkdownContent>{`- first\n- second`}</MarkdownContent>)
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    const list = document.querySelector('ul')
    expect(list).toBeTruthy()
    expect(list?.querySelectorAll('li')).toHaveLength(2)
  })

  test('adds target and rel on external http links', () => {
    render(<MarkdownContent>[link](https://example.com)</MarkdownContent>)
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('does not force target blank on relative links', () => {
    render(<MarkdownContent>[dash](/dashboard)</MarkdownContent>)
    const link = screen.getByRole('link', { name: 'dash' })
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).not.toHaveAttribute('target')
  })

  test('merges optional className on root', () => {
    const { container } = render(<MarkdownContent className="extra-root">x</MarkdownContent>)
    expect(container.firstElementChild).toHaveClass('extra-root')
  })
})
