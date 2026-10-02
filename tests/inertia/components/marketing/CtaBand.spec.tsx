import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CtaBand } from '~/components/marketing/CtaBand'

describe('CtaBand', () => {
  test('rend le titre en h2 inversé sur une bande ink avec ses actions', () => {
    const { container } = render(
      <CtaBand
        eyebrow="Et maintenant"
        title="Prêt à passer en mode cabinet ?"
        description="Faites une démo."
        actions={<a href="#demo">Demander une démo</a>}
      />
    )

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Prêt à passer en mode cabinet ?',
    })
    expect(heading).toHaveClass('text-on-ink')
    expect(screen.getByText('Et maintenant')).toBeInTheDocument()
    expect(screen.getByText('Faites une démo.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Demander une démo' })).toHaveAttribute('href', '#demo')
    expect(container.querySelector('.bg-ink')).toHaveClass('rounded-2xl', 'overflow-hidden')
  })

  test('pose l’horizon crépusculaire décoratif au bas de la bande', () => {
    const { container } = render(<CtaBand title="Prêt ?" actions={<a href="#demo">Go</a>} />)

    const landscape = container.querySelector('svg[data-variant="dusk"]')
    expect(landscape).toHaveAttribute('aria-hidden', 'true')
    expect(landscape?.parentElement).toHaveClass('absolute', 'bottom-0', 'pointer-events-none')
  })

  test('fonctionne sans eyebrow ni description', () => {
    render(<CtaBand title="Une question ?" actions={<a href="#contact">Écrire</a>} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Une question ?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Écrire' })).toBeInTheDocument()
  })
})
