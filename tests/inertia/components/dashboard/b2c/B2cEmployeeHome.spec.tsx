import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { B2cEmployeeHome } from '~/components/dashboard/b2c/B2cEmployeeHome'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { makeEmployee } from '../../../support/factories'

vi.mock('../../../../../inertia/hooks/use_billing', () => ({
  useBilling: () => ({ paymentsEnabled: false, resultsPriceCents: 4900, currency: 'eur' }),
}))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, className, children, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const unpaid: ExerciseAccess = {
  accountType: 'b2c',
  unlockedExerciseSlugs: ['motivation', 'values'],
  lockedReason: 'payment',
  hasPaidAccess: false,
  freeExerciseTypes: ['motivation', 'values'],
  paymentsEnabled: false,
}

const baseProps = {
  completedExercises: 1,
  totalExercises: 8,
  exerciseCompletionPercent: 12,
  exerciseProgressByType: { motivation: 100 },
}

describe('B2cEmployeeHome (#100)', () => {
  test('salue le particulier, annonce les exercices offerts, sans feuille de route ni expert', () => {
    render(
      <B2cEmployeeHome
        {...baseProps}
        employee={makeEmployee({ name: 'Camille Martin', targetRole: 'UX designer' })}
        advisor={null}
        exerciseAccess={unpaid}
      />
    )

    expect(screen.getByRole('heading', { name: 'Bonjour Camille' })).toBeInTheDocument()
    expect(screen.getByText('UX designer')).toBeInTheDocument()
    expect(screen.getByText(/Commencez par les 2 exercices offerts/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progression des exercices' })).toHaveAttribute(
      'aria-valuenow',
      '12'
    )
    expect(screen.getByText('1/8 terminés · 12 %')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Vos exercices' })).toBeInTheDocument()
    expect(screen.queryByText(/Feuille de route/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Votre expert/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Conseils de votre expert/)).not.toBeInTheDocument()
    // #101 : carte « forfait » compacte tant que le forfait n'est pas réglé.
    expect(
      screen.getByRole('region', { name: 'Débloquez tout votre parcours' })
    ).toBeInTheDocument()
    expect(screen.getByText(/49 €/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mon profil' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/profile'
    )
    expect(screen.getByRole('link', { name: 'Ma synthèse' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/synthesis'
    )
  })

  test('affiche l’expert assigné (sans ses notes) et les compétences (5 max) quand il y en a', () => {
    render(
      <B2cEmployeeHome
        {...baseProps}
        employee={makeEmployee({
          advisorNotes: 'Mets en avant ta reconversion',
          skills: Array.from({ length: 6 }, (_, i) => ({
            id: i,
            name: `Compétence ${i + 1}`,
            category: null,
            level: (i % 5) + 1,
          })),
        })}
        advisor={{ name: 'Nadia Experte' }}
        exerciseAccess={{ ...unpaid, hasPaidAccess: true }}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Votre expert : Nadia Experte' })
    ).toBeInTheDocument()
    // Les notes du conseiller ne sont jamais montrées au candidat.
    expect(screen.queryByText(/Mets en avant ta reconversion/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Conseils de votre expert/)).not.toBeInTheDocument()
    expect(screen.getByText('Compétence 5')).toBeInTheDocument()
    expect(screen.queryByText('Compétence 6')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Tous les exercices et vos résultats sont débloqués/)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Débloquez tout votre parcours' })
    ).not.toBeInTheDocument()
    // #103 : expert déjà assigné → pas de CTA de demande.
    expect(
      screen.queryByRole('link', { name: 'Demander un accompagnement' })
    ).not.toBeInTheDocument()
  })

  test('payé sans expert (#103) : CTA vers la demande d’accompagnement', () => {
    render(
      <B2cEmployeeHome
        {...baseProps}
        employee={makeEmployee()}
        advisor={null}
        exerciseAccess={{ ...unpaid, hasPaidAccess: true }}
      />
    )

    expect(screen.getByRole('link', { name: 'Demander un accompagnement' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/accompagnement'
    )
  })

  test('non payé : pas de CTA de demande d’accompagnement', () => {
    render(
      <B2cEmployeeHome
        {...baseProps}
        employee={makeEmployee()}
        advisor={null}
        exerciseAccess={unpaid}
      />
    )

    expect(
      screen.queryByRole('link', { name: 'Demander un accompagnement' })
    ).not.toBeInTheDocument()
  })

  test('propose de discuter avec un expert, payé ou non', () => {
    render(
      <B2cEmployeeHome
        {...baseProps}
        employee={makeEmployee()}
        advisor={null}
        exerciseAccess={unpaid}
      />
    )
    expect(screen.getByRole('link', { name: 'Discuter avec un expert' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/chat'
    )
  })
})
