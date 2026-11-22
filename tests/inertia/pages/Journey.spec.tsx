import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Journey from '../../../inertia/pages/Journey'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Journey page (/parcours)', () => {
  beforeEach(() => resetInertiaMock())

  test('titre puis les huit exercices avec numéro, nom et description', () => {
    render(<Journey />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Huit exercices pour y voir clair.' })
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    for (const [index, exercise] of EXERCISE_LIST.entries()) {
      expect(within(main).getByRole('heading', { name: exercise.title })).toBeInTheDocument()
      expect(within(main).getByText(`Exercice ${index + 1}`)).toBeInTheDocument()
      expect(within(main).getByText(exercise.description)).toBeInTheDocument()
    }
  })

  test('bouton « Commencer gratuitement » en bas quand l’inscription est ouverte', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<Journey />)

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Commencer gratuitement' })
    ).toHaveAttribute('href', '/inscription')
  })
})
