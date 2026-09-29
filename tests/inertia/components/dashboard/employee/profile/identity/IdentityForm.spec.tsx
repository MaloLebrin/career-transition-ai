import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { IdentityForm } from '~/components/dashboard/employee/profile/identity/IdentityForm'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
} from '../../../../../support/inertia_mock'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

const employee = {
  name: 'Camille Martin',
  currentRole: 'Comptable',
  targetRole: 'Contrôleuse de gestion',
  summary: null,
}

describe('IdentityForm (#70)', () => {
  beforeEach(() => resetInertiaMock())

  test('pré-remplit l’identité du candidat, sans champ e-mail', () => {
    renderWithUser(<IdentityForm employee={employee} />)

    expect(screen.getByLabelText(/^Nom complet/, { selector: 'input' })).toHaveValue(
      'Camille Martin'
    )
    expect(screen.getByLabelText(/^Poste actuel/, { selector: 'input' })).toHaveValue('Comptable')
    expect(screen.getByLabelText(/^Poste visé/, { selector: 'input' })).toHaveValue(
      'Contrôleuse de gestion'
    )
    expect(screen.getByLabelText('Résumé')).toHaveValue('')
    expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument()
  })

  test('désactive l’envoi tant que rien n’a changé', () => {
    renderWithUser(<IdentityForm employee={employee} />)

    expect(screen.getByRole('button', { name: 'Enregistrer mon identité' })).toBeDisabled()
  })

  test('envoie un PUT /dashboard/candidat/profile sans perdre le scroll', async () => {
    const { user } = renderWithUser(<IdentityForm employee={employee} />)

    const target = screen.getByLabelText(/^Poste visé/, { selector: 'input' })
    await user.clear(target)
    await user.type(target, 'Data analyst')
    await user.type(screen.getByLabelText('Résumé'), 'Reconversion')
    await user.click(screen.getByRole('button', { name: 'Enregistrer mon identité' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/candidat/profile',
      data: {
        name: 'Camille Martin',
        currentRole: 'Comptable',
        targetRole: 'Data analyst',
        summary: 'Reconversion',
      },
      options: { preserveScroll: true },
    })
  })

  test('affiche les erreurs de validation', async () => {
    setInertiaOutcome({ errors: { name: 'Le nom est requis' } })
    const { user } = renderWithUser(<IdentityForm employee={employee} />)

    await user.type(screen.getByLabelText(/^Poste actuel/, { selector: 'input' }), ' senior')
    await user.click(screen.getByRole('button', { name: 'Enregistrer mon identité' }))

    expect(screen.getByText('Le nom est requis')).toBeInTheDocument()
  })
})
