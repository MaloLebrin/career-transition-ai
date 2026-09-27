import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FlashBanner from '~/components/layout/FlashBanner'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('FlashBanner', () => {
  beforeEach(() => resetInertiaMock())
  afterEach(() => vi.useRealTimers())

  test('ne rend rien sans message flash', () => {
    setPageProps({ flash: {} })
    const { container } = render(<FlashBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  test('affiche un message de succès avec le style associé', () => {
    setPageProps({ flash: { success: 'Profil enregistré' } })
    render(<FlashBanner />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Profil enregistré')
    expect(alert).toHaveClass('text-brand-sage')
  })

  test('affiche un message d’erreur avec le style associé', () => {
    setPageProps({ flash: { error: 'Action impossible' } })
    render(<FlashBanner />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Action impossible')
    expect(alert).toHaveClass('text-rose-800')
  })

  test('le bouton Fermer masque la bannière', async () => {
    setPageProps({ flash: { error: 'Oups' } })
    render(<FlashBanner />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('disparaît automatiquement après 5 secondes et réapparaît pour un nouveau message', () => {
    vi.useFakeTimers()
    setPageProps({ flash: { success: 'Premier' } })
    const { rerender } = render(<FlashBanner />)

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    setPageProps({ flash: { success: 'Second' } })
    rerender(<FlashBanner />)
    expect(screen.getByRole('alert')).toHaveTextContent('Second')
  })
})
