import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import RegisterCandidate from '~/pages/RegisterCandidate'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('RegisterCandidate page (#93)', () => {
  beforeEach(() => resetInertiaMock())

  test('rend le formulaire particulier sans erreur par défaut', () => {
    render(<RegisterCandidate />)

    expect(screen.getByRole('heading', { name: 'Créer mon compte' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('transmet le flash d’erreur (e-mail déjà utilisé)', () => {
    setPageProps({ flash: { error: 'Cet email est déjà utilisé.' } })
    render(<RegisterCandidate />)

    expect(screen.getByRole('alert')).toHaveTextContent('Cet email est déjà utilisé.')
  })
})
