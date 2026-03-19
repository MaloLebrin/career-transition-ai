import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LinkActions from '../../../../inertia/components/ui/LinkActions'

describe('LinkActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('renders nothing when value is not a URL', () => {
    const { container } = render(<LinkActions value="Bureau Paris" />)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders copy and open buttons when value is a URL', () => {
    render(<LinkActions value="https://example.com/meet" />)
    expect(screen.getByRole('button', { name: /Copier/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir/i })).toBeInTheDocument()
  })

  test('copies to clipboard when clicking copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<LinkActions value="https://example.com/meet" />)
    fireEvent.click(screen.getByRole('button', { name: /Copier/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/meet')
    })
  })

  test('opens a new tab when clicking open', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<LinkActions value="https://example.com/meet" />)
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir/i }))
    expect(openSpy).toHaveBeenCalledWith('https://example.com/meet', '_blank', 'noopener,noreferrer')
  })
})

