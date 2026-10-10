import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHero } from '../../../../inertia/components/marketing/PageHero'

describe('PageHero', () => {
  test('centered hero: level-1 title, description, actions, soft backdrop', () => {
    render(
      <PageHero
        eyebrow="Méthodologie"
        title="Un titre de page"
        description="Une description"
        actions={<button type="button">Agir</button>}
      />
    )
    const title = screen.getByRole('heading', { level: 1, name: 'Un titre de page' })
    expect(title.closest('.text-center')).not.toBeNull()
    expect(screen.getByText('Une description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agir' })).toBeInTheDocument()
    expect(screen.getByTestId('hero-backdrop').querySelector('.bg-hero-mesh')).toHaveClass(
      'opacity-45'
    )
  })

  test('with an aside: two columns, left-aligned, extra content below the actions', () => {
    render(
      <PageHero eyebrow="Offre" title="Titre" aside={<p>Visuel</p>}>
        <p>Preuves</p>
      </PageHero>
    )
    expect(screen.getByText('Visuel')).toBeInTheDocument()
    expect(screen.getByText('Preuves')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).closest('.text-center')).toBeNull()
  })
})
