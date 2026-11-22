import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ExercisePills } from '../../../../../inertia/components/marketing/home/ExercisePills'
import { FinalCall } from '../../../../../inertia/components/marketing/home/FinalCall'
import { HomeSteps } from '../../../../../inertia/components/marketing/home/HomeSteps'
import { PlanBand } from '../../../../../inertia/components/marketing/home/PlanBand'
import { StartAction } from '../../../../../inertia/components/marketing/home/StartAction'
import { TrustColumns } from '../../../../../inertia/components/marketing/home/TrustColumns'
import { BRAND_PASTEL_CYCLE, brandPastel } from '../../../../../inertia/components/marketing/tints'
import { resetInertiaMock, setPageProps } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('blocs de l’accueil jumpUjob', () => {
  beforeEach(() => resetInertiaMock())

  test('brandPastel tourne sur les cinq couples du brief, dans l’ordre', () => {
    expect(BRAND_PASTEL_CYCLE).toEqual(['sun', 'lake', 'blossom', 'sky', 'meadow'])
    expect(brandPastel(0)).toEqual({
      surface: 'bg-tint-sun',
      ink: 'text-tint-sun-ink',
      dot: 'bg-tint-sun-ink',
    })
    expect(brandPastel(5)).toEqual(brandPastel(0))
    expect(brandPastel(6).surface).toBe('bg-tint-lake')
  })

  test('StartAction : inscription, liste d’attente sur l’accueil ou depuis une autre page', () => {
    const { rerender } = render(<StartAction registrationOpen />)
    expect(screen.getByRole('link', { name: 'Commencer gratuitement' })).toHaveAttribute(
      'href',
      '/inscription'
    )

    rerender(<StartAction registrationOpen={false} onHome />)
    expect(screen.getByRole('link', { name: 'Être prévenu de l’ouverture' })).toHaveAttribute(
      'href',
      '#contact'
    )

    rerender(<StartAction registrationOpen={false} />)
    expect(screen.getByRole('link', { name: 'Être prévenu de l’ouverture' })).toHaveAttribute(
      'href',
      '/#contact'
    )
  })

  test('HomeSteps : trois cartes numérotées dans les pastels 1, 2 et 3', () => {
    render(<HomeSteps />)

    const steps = screen.getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(within(steps[0]).getByText('1')).toHaveClass('bg-tint-sun', 'text-tint-sun-ink')
    expect(within(steps[1]).getByText('2')).toHaveClass('bg-tint-lake')
    expect(within(steps[2]).getByText('3')).toHaveClass('bg-tint-blossom')
    expect(
      screen.getByRole('heading', { name: 'Créez votre compte en deux minutes' })
    ).toBeInTheDocument()
  })

  test('ExercisePills : huit pastilles qui passent à la ligne, couleurs en rotation', () => {
    render(<ExercisePills />)

    const list = screen.getByRole('list', { name: 'Les exercices du parcours' })
    expect(list).toHaveClass('flex-wrap')
    const pills = within(list).getAllByRole('listitem')
    expect(pills).toHaveLength(8)
    expect(pills[0]).toHaveClass('bg-tint-sun')
    expect(pills[5]).toHaveClass('bg-tint-sun')
  })

  test('PlanBand : exercices offerts puis prix TTC payé une fois, ancre #tarif, CTA', () => {
    setPageProps({ billing: { paymentsEnabled: true, resultsPriceCents: 4900, currency: 'eur' } })
    const { container } = render(<PlanBand registrationOpen />)

    expect(container.querySelector('#tarif')).toHaveClass('bg-tint-lake-ink', 'text-on-ink')
    const card = screen.getByRole('group', { name: 'Forfait particuliers' })
    expect(card).toHaveTextContent('49 €')
    expect(card).toHaveTextContent('TTC · payé une seule fois')
    // Non-régression : le CTA « gratuit » doit être justifié par les exercices offerts.
    expect(card).toHaveTextContent('Deux exercices offerts pour commencer')
    expect(
      screen.getByRole('heading', { name: 'Commencez gratuitement, payez une seule fois.' })
    ).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Commencer gratuitement' })).toBeInTheDocument()
  })

  test('TrustColumns : trois colonnes avec icône et la page sécurité', () => {
    render(<TrustColumns />)

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    const icons = screen.getAllByTestId('trust-icon')
    expect(icons).toHaveLength(3)
    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon.querySelector('svg')).not.toBeNull()
    }
    expect(icons[0]).toHaveClass('bg-tint-sun')
    expect(icons[1]).toHaveClass('bg-tint-lake')
    expect(screen.getByRole('link', { name: 'Lire la page sécurité' })).toHaveAttribute(
      'href',
      '/securite'
    )
  })

  test('FinalCall : titre du brief, description optionnelle, action', () => {
    render(<FinalCall action={<button type="button">Go</button>} description="Sans engagement." />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Sautez. On tient la rampe.' })
    ).toBeInTheDocument()
    expect(screen.getByText('Sans engagement.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
