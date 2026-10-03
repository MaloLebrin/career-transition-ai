import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { B2cExerciseGrid } from '~/components/dashboard/b2c/B2cExerciseGrid'
import type { ExerciseAccess } from '#shared/types/exercise/access'

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, className, children, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const exercises = [
  { slug: 'disc', title: 'Profil DISC', description: 'DISC.' },
  { slug: 'motivation', title: 'Analyse Motivations', description: 'Motivations.' },
  { slug: 'values', title: 'Recherche de Valeurs', description: 'Valeurs.' },
]

const unpaid: ExerciseAccess = {
  accountType: 'b2c',
  unlockedExerciseSlugs: ['motivation', 'values'],
  lockedReason: 'payment',
  hasPaidAccess: false,
  freeExerciseTypes: ['motivation', 'values'],
  paymentsEnabled: true,
}

describe('B2cExerciseGrid (#100)', () => {
  test('gratuits d’abord avec badge « Gratuit », exercice du forfait verrouillé derrière', () => {
    render(
      <B2cExerciseGrid exercises={exercises} exerciseAccess={unpaid} progressByType={{}} />
    )

    const items = within(screen.getByRole('list', { name: 'Vos exercices' })).getAllByRole(
      'listitem'
    )
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Analyse Motivations')
    expect(items[1]).toHaveTextContent('Recherche de Valeurs')
    expect(items[2]).toHaveTextContent('Profil DISC')

    expect(screen.getAllByText('Gratuit')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Analyse Motivations/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/exercises/motivation'
    )
    expect(screen.queryByRole('link', { name: 'Profil DISC' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Débloquer : Profil DISC' })).toBeInTheDocument()
  })

  test('forfait payé : tout est cliquable, les exercices du forfait sont marqués « Inclus »', () => {
    render(
      <B2cExerciseGrid
        exercises={exercises}
        exerciseAccess={{
          ...unpaid,
          hasPaidAccess: true,
          unlockedExerciseSlugs: ['motivation', 'values', 'disc'],
        }}
        progressByType={{ motivation: 100, disc: 40 }}
      />
    )

    expect(screen.getByRole('link', { name: /Profil DISC/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/exercises/disc'
    )
    expect(screen.getByText('Inclus dans le forfait')).toBeInTheDocument()
    expect(screen.queryByText('Débloquer')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Terminé')).toBeInTheDocument()
    expect(screen.getByText('En cours · 40 %')).toBeInTheDocument()
    expect(screen.getByText('À commencer')).toBeInTheDocument()
  })
})
