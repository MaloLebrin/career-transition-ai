import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MethodologyPage from '../../../../inertia/components/marketing/MethodologyPage'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('MethodologyPage', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le titre principal et les actions de conversion', () => {
    render(<MethodologyPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Une méthode d.accompagnement/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Découvrir l.offre/ })).toHaveAttribute(
      'href',
      '/offre'
    )
    expect(screen.getAllByRole('link', { name: /Poser une question/ }).length).toBeGreaterThan(0)
  })

  test('présente les trois étapes du conseiller et le formulaire de contact', () => {
    render(<MethodologyPage />)

    expect(screen.getByText('Avant')).toBeInTheDocument()
    expect(screen.getByText('Pendant')).toBeInTheDocument()
    expect(screen.getByText('Après')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
  })
})
