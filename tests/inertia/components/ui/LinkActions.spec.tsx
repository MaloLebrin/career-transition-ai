import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    expect(screen.getByRole('button', { name: /Copier le lien/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir le lien dans un nouvel onglet/i })).toBeInTheDocument()
  })

  test('copies to clipboard when clicking copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<LinkActions value="https://example.com/meet" />)
    fireEvent.click(screen.getByRole('button', { name: /Copier le lien/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/meet')
    })
  })

  test('opens a new tab when clicking open', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<LinkActions value="https://example.com/meet" />)
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le lien dans un nouvel onglet/i }))
    expect(openSpy).toHaveBeenCalledWith('https://example.com/meet', '_blank', 'noopener,noreferrer')
  })
})


describe('LinkActions — copie', () => {
  const originalExecCommand = document.execCommand

  afterEach(() => {
    vi.useRealTimers()
    document.execCommand = originalExecCommand
  })

  test('affiche une coche après copie puis revient à l’icône de copie après 1,5 s', async () => {
    vi.useFakeTimers()
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    render(<LinkActions value="  https://example.com/visio  " className="mt-2" />)

    const button = screen.getByRole('button', { name: 'Copier le lien' })
    const iconBefore = button.innerHTML
    await act(async () => {
      fireEvent.click(button)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/visio')
    expect(button.innerHTML).not.toBe(iconBefore)

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(button.innerHTML).toBe(iconBefore)
  })

  test('sans API clipboard, utilise le repli execCommand et nettoie le textarea temporaire', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    render(<LinkActions value="https://example.com/meet" />)
    const button = screen.getByRole('button', { name: 'Copier le lien' })
    const iconBefore = button.innerHTML
    await act(async () => {
      fireEvent.click(button)
    })

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
    expect(button.innerHTML).not.toBe(iconBefore)
  })

  test('si le repli échoue aussi, l’icône ne change pas', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    document.execCommand = vi.fn(() => {
      throw new Error('unsupported')
    })

    render(<LinkActions value="https://example.com/meet" />)
    const button = screen.getByRole('button', { name: 'Copier le lien' })
    const iconBefore = button.innerHTML
    await act(async () => {
      fireEvent.click(button)
    })
    expect(button.innerHTML).toBe(iconBefore)
  })

  test('si execCommand renvoie false, l’icône ne change pas', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    document.execCommand = vi.fn().mockReturnValue(false)

    render(<LinkActions value="https://example.com/meet" />)
    const button = screen.getByRole('button', { name: 'Copier le lien' })
    const iconBefore = button.innerHTML
    await act(async () => {
      fireEvent.click(button)
    })
    expect(button.innerHTML).toBe(iconBefore)
  })
})
