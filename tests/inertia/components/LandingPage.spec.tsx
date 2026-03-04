import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '../../../inertia/components/landing/LandingPage'

describe('LandingPage', () => {
  test('renders hero and uses PublicLayout', () => {
    const onEnterApp = vi.fn()

    render(<LandingPage onEnterApp={onEnterApp} />)

    expect(screen.getByText(/L'IA qui structure le/)).toBeInTheDocument()
    expect(screen.getByText(/Potentiel Humain/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lancer le Portail/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Consulter la Méthodologie/i })).toBeInTheDocument()
  })

  test('onEnterApp is called when clicking Lancer le Portail', async () => {
    const onEnterApp = vi.fn()
    render(<LandingPage onEnterApp={onEnterApp} />)

    screen.getByRole('button', { name: /Lancer le Portail/i }).click()

    expect(onEnterApp).toHaveBeenCalledTimes(1)
  })

  test('renders methodology and AI sections', () => {
    render(<LandingPage onEnterApp={() => {}} />)

    expect(screen.getByText(/Plus qu'un outil/)).toBeInTheDocument()
    expect(screen.getByText(/L'IA qui comprend/)).toBeInTheDocument()
    expect(screen.getAllByText(/Gemini/).length).toBeGreaterThanOrEqual(1)
  })
})
