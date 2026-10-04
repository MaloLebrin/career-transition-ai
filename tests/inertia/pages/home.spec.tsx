import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../../../inertia/pages/home'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('home page', () => {
  beforeEach(() => resetInertiaMock())

  test('rend l’accueil particuliers, pas la landing cabinet', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<Home />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Faites le point sur votre carrière/ })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Structurez vos bilans de compétences/)).not.toBeInTheDocument()
  })
})
