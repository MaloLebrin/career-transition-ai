import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CandidatOnboarding from '~/pages/dashboard/employee/onboarding/Onboarding'
import { resetInertiaMock, routerSpies, setInertiaOutcome } from '../../../../support/inertia_mock'
import { makeEmployee } from '../../../../support/factories'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})
vi.mock('~/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('~/components/onboarding/OnboardingFlow', () => ({
  default: ({ employee, onComplete }: { employee: { name: string }; onComplete: (e: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onComplete({
          ...employee,
          name: 'Camille M.',
          skills: [{ id: 1, name: ' SQL ', level: 4 }],
          experiences: [],
          educations: [],
        })
      }
    >
      Terminer l’onboarding de {employee.name}
    </button>
  ),
}))

describe('Onboarding candidat (page)', () => {
  beforeEach(() => resetInertiaMock())

  test('à la fin du parcours : PUT du profil marqué onboardé puis retour au tableau de bord', async () => {
    setInertiaOutcome('success')
    render(<CandidatOnboarding employee={makeEmployee({ onboarded: false })} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /Terminer l’onboarding de Camille Martin/ }))

    expect(routerSpies.put).toHaveBeenCalledWith(
      '/dashboard/candidat/onboarding',
      expect.objectContaining({
        name: 'Camille M.',
        onboarded: true,
        skills: [{ name: 'SQL', level: 4 }],
        experiences: [],
        educations: [],
      }),
      expect.any(Object)
    )
    expect(routerSpies.visit).toHaveBeenCalledWith('/dashboard/candidat')
  })
})
