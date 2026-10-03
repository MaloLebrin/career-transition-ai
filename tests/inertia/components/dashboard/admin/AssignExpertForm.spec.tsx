import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AssignExpertForm } from '~/components/dashboard/admin/AssignExpertForm'
import type { PlatformTeamMember } from '#shared/types/expert_request/admin'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

const experts: PlatformTeamMember[] = [
  {
    id: 7,
    name: 'Nadia Experte',
    email: 'nadia@plateforme.test',
    role: 'advisor',
    onboardingCompleted: true,
    assignedCandidatesCount: 2,
  },
  {
    id: 8,
    name: 'Omar Admin',
    email: 'omar@plateforme.test',
    role: 'admin',
    onboardingCompleted: false,
    assignedCandidatesCount: 0,
  },
]

describe('AssignExpertForm (#105)', () => {
  beforeEach(() => resetInertiaMock())

  test('sans membre : invite à en créer un, pas de formulaire', () => {
    render(<AssignExpertForm requestId={1} experts={[]} />)

    expect(screen.getByText(/Aucun membre dans l’équipe interne/)).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  test('poste l’expert choisi sur la route d’assignation', async () => {
    const { user } = renderWithUser(<AssignExpertForm requestId={12} experts={experts} />)

    expect(screen.getByText(/2 candidat\(s\) suivi\(s\)/)).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Expert' }), '8')
    expect(screen.getByText(/compte non activé/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Assigner' }))

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/expert-requests/12/assign',
      data: { expertUserId: '8' },
      options: { preserveScroll: true },
    })
  })
})
