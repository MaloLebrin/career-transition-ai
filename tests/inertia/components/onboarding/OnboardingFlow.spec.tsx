import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingFlow from '../../../../inertia/components/onboarding/OnboardingFlow'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    router: { visit: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
    Head: () => null,
  }
})

// Avoid hitting Gemini in tests
vi.mock('../../../../inertia/services/ai_service', () => ({
  extractCVData: vi.fn(async () => null),
}))

describe('OnboardingFlow', () => {
  test('reaches step 3 and renders ProfilePage editor', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(
      <OnboardingFlow
        employee={{
          id: 1,
          organizationId: 10,
          advisorId: 2,
          name: 'Marie Martin',
          email: 'marie@example.com',
          currentRole: 'Développeuse',
          targetRole: 'Lead Tech',
          skills: [],
          summary: '',
          experiences: [],
          educations: [],
          status: 'onboarding' as any,
          onboarded: false,
          exercises: [],
          plan: [],
        }}
        onComplete={onComplete}
      />
    )

    await user.click(screen.getByRole('button', { name: /Compléter mon Profil/i }))
    await user.click(screen.getByRole('button', { name: /Saisir manuellement/i }))

    expect(screen.getByText(/Mon Profil Carrière/i)).toBeInTheDocument()
  })

  test('calls onComplete with onboarded=true on save', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(
      <OnboardingFlow
        employee={{
          id: 1,
          organizationId: 10,
          advisorId: 2,
          name: 'Marie Martin',
          email: 'marie@example.com',
          currentRole: 'Développeuse',
          targetRole: 'Lead Tech',
          skills: [],
          summary: '',
          experiences: [],
          educations: [],
          status: 'onboarding' as any,
          onboarded: false,
          exercises: [],
          plan: [],
        }}
        onComplete={onComplete}
      />
    )

    await user.click(screen.getByRole('button', { name: /Compléter mon Profil/i }))
    await user.click(screen.getByRole('button', { name: /Saisir manuellement/i }))

    await user.click(screen.getByRole('button', { name: /Sauvegarder/i }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const arg = onComplete.mock.calls[0][0]
    expect(arg.onboarded).toBe(true)
  })
})

