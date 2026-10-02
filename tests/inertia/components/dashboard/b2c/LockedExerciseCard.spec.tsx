import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LockedExerciseCard } from '~/components/dashboard/b2c/LockedExerciseCard'

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, className, children, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const exercise = {
  slug: 'disc',
  title: 'Profil DISC',
  description: 'Découvrez votre style de communication.',
}

describe('LockedExerciseCard (#100)', () => {
  test('présente l’exercice comme inclus dans le forfait, sans lien vers l’outil', () => {
    render(<LockedExerciseCard exercise={exercise} paymentsEnabled />)

    expect(screen.getByRole('group', { name: 'Profil DISC' })).toBeInTheDocument()
    expect(screen.getByText('Découvrez votre style de communication.')).toBeInTheDocument()
    expect(screen.getByText('Inclus dans le forfait')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Profil DISC' })).not.toBeInTheDocument()
  })

  test('paiement activé : CTA « Débloquer » vers l’offre', () => {
    render(<LockedExerciseCard exercise={exercise} paymentsEnabled />)

    expect(screen.getByRole('link', { name: 'Débloquer : Profil DISC' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/offre'
    )
  })

  test('paiement désactivé : « Bientôt disponible », aucun lien', () => {
    render(<LockedExerciseCard exercise={exercise} paymentsEnabled={false} />)

    expect(screen.getByText('Bientôt disponible')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
