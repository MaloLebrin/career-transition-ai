import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import {
  CANDIDATE_DATA_EXPORT_URL,
  CANDIDATE_ERASURE_REQUEST_URL,
  DataRights,
} from '~/components/dashboard/employee/profile/data_rights/DataRights'
import { resetInertiaMock, routerSpies } from '../../../../../support/inertia_mock'
import { renderWithUser } from '../../../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../../support/inertia_mock')
  return inertiaMock()
})

describe('DataRights (#70)', () => {
  beforeEach(() => resetInertiaMock())

  test('propose le téléchargement de l’archive', () => {
    renderWithUser(<DataRights rights={{ erasureRequestedAt: null }} />)

    const link = screen.getByRole('link', { name: 'Télécharger mes données' })
    expect(link).toHaveAttribute('href', CANDIDATE_DATA_EXPORT_URL)
    expect(link).toHaveAttribute('download')
  })

  test('la demande d’effacement passe par une confirmation', async () => {
    const { user } = renderWithUser(<DataRights rights={{ erasureRequestedAt: null }} />)

    await user.click(screen.getByRole('button', { name: 'Demander l’effacement de mes données' }))
    expect(routerSpies.post).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }))

    expect(routerSpies.post).toHaveBeenCalledOnce()
    const [url, data, options] = routerSpies.post.mock.calls[0]
    expect(url).toBe(CANDIDATE_ERASURE_REQUEST_URL)
    expect(data).toEqual({})
    expect(options).toMatchObject({ preserveScroll: true })
  })

  test('annuler la confirmation n’envoie rien', async () => {
    const { user } = renderWithUser(<DataRights rights={{ erasureRequestedAt: null }} />)

    await user.click(screen.getByRole('button', { name: 'Demander l’effacement de mes données' }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(routerSpies.post).not.toHaveBeenCalled()
  })

  test('une demande en cours affiche sa date à la place du bouton', () => {
    renderWithUser(<DataRights rights={{ erasureRequestedAt: '2026-09-01T10:00:00.000Z' }} />)

    expect(screen.getByRole('status')).toHaveTextContent(/1 septembre 2026/)
    expect(
      screen.queryByRole('button', { name: 'Demander l’effacement de mes données' })
    ).not.toBeInTheDocument()
  })
})
