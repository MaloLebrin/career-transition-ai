import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { RATE_LIMIT_ERROR_KEY } from '#shared/helpers/rate_limit'
import RegisterCandidatePage, {
  CANDIDATE_PASSWORD_HINT,
} from '~/components/auth/RegisterCandidatePage'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('RegisterCandidatePage (#93)', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le formulaire particulier : nom, e-mail, mot de passe, case CGU, promesse des exercices gratuits', () => {
    renderWithUser(<RegisterCandidatePage error={null} />)

    expect(screen.getByRole('heading', { name: 'Créer mon compte' })).toBeInTheDocument()
    expect(screen.getByText(/Motivations et Valeurs sont gratuits/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Nom complet/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
    expect(screen.getByText(CANDIDATE_PASSWORD_HINT)).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.queryByPlaceholderText(/Cabinet/)).not.toBeInTheDocument()
  })

  test('les CGU et la confidentialité s’ouvrent dans un nouvel onglet', () => {
    renderWithUser(<RegisterCandidatePage error={null} />)

    const cgu = screen.getByRole('link', { name: /conditions générales d’utilisation/ })
    expect(cgu).toHaveAttribute('href', '/cgu')
    expect(cgu).toHaveAttribute('target', '_blank')
    expect(cgu).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /politique de confidentialité/ })).toHaveAttribute(
      'href',
      '/confidentialite'
    )
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
  })

  test('envoie le payload vers /auth/register/candidat avec la case cochée', async () => {
    const { user } = renderWithUser(<RegisterCandidatePage error={null} />)

    await user.type(screen.getByRole('textbox', { name: /Nom complet/ }), 'Camille Durand')
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'camille@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'motdepasse-8')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/auth/register/candidat',
      data: {
        name: 'Camille Durand',
        email: 'camille@example.com',
        password: 'motdepasse-8',
        acceptTerms: true,
      },
    })
  })

  test('affiche les erreurs serveur champ par champ, y compris la case CGU', async () => {
    setInertiaOutcome({
      errors: {
        email: 'E-mail invalide',
        password: 'Trop court',
        acceptTerms: 'Vous devez accepter les conditions.',
      },
    })
    const { user } = renderWithUser(<RegisterCandidatePage error={null} />)

    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(screen.getByText('E-mail invalide')).toBeInTheDocument()
    expect(screen.getByText('Trop court')).toBeInTheDocument()
    expect(screen.getByText('Vous devez accepter les conditions.')).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('affiche le message de quota renvoyé par le serveur', async () => {
    setInertiaOutcome({ errors: { [RATE_LIMIT_ERROR_KEY]: 'Trop de tentatives.' } })
    const { user } = renderWithUser(<RegisterCandidatePage error={null} />)

    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Trop de tentatives.')
  })

  test('affiche l’erreur globale (flash)', () => {
    renderWithUser(<RegisterCandidatePage error="Cet email est déjà utilisé." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Cet email est déjà utilisé.')
  })
})
