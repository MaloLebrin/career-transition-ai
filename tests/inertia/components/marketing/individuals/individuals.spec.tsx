import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { countWord } from '../../../../../inertia/components/marketing/individuals/copy'
import { IndividualsHero } from '../../../../../inertia/components/marketing/individuals/IndividualsHero'
import { ResultsPlanCard } from '../../../../../inertia/components/marketing/individuals/ResultsPlanCard'
import { resetInertiaMock, setPageProps } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('individuals marketing blocks', () => {
  beforeEach(() => resetInertiaMock())

  test('countWord écrit les nombres en lettres, au-delà de neuf en chiffres', () => {
    expect(countWord(2)).toBe('deux')
    expect(countWord(8)).toBe('huit')
    expect(countWord(12)).toBe('12')
  })

  test('IndividualsHero : inscription ouverte', () => {
    render(<IndividualsHero registrationOpen />)

    expect(screen.getByRole('link', { name: 'Commencer gratuitement' })).toHaveAttribute(
      'href',
      '/inscription'
    )
  })

  test('IndividualsHero : inscription fermée', () => {
    render(<IndividualsHero registrationOpen={false} />)

    expect(screen.getByRole('link', { name: 'Être prévenu de l’ouverture' })).toHaveAttribute(
      'href',
      '#contact'
    )
  })

  test('ResultsPlanCard : prix TTC, inclus, non inclus et liens légaux', () => {
    setPageProps({ billing: { paymentsEnabled: true, resultsPriceCents: 4900, currency: 'eur' } })
    render(<ResultsPlanCard />)

    const card = screen.getByRole('group', { name: 'Forfait particuliers' })
    expect(card).toHaveTextContent('49 €')
    expect(card).toHaveTextContent('Inclus')
    expect(card).toHaveTextContent('Non inclus')
    expect(screen.getByRole('link', { name: 'Conditions de vente' })).toHaveAttribute(
      'href',
      '/cgv'
    )
  })
})
