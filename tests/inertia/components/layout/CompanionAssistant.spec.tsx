import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  ASSISTANT_COLLAPSED_KEY,
  CompanionAssistant,
} from '../../../../inertia/components/layout/assistant/CompanionAssistant'
import {
  normalizePath,
  tipFor,
} from '../../../../inertia/components/layout/assistant/assistant_tips'
import PublicLayout from '../../../../inertia/components/layout/PublicLayout'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    fireEvent.scroll(window)
  })
}

describe('assistant_tips', () => {
  test('normalizePath ignore requête, ancre et barre finale', () => {
    expect(normalizePath('/tarifs?promo=1#faq')).toBe('/tarifs')
    expect(normalizePath('/qui-sommes-nous/')).toBe('/qui-sommes-nous')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
  })

  test('un conseil propre à chaque page publique, un conseil général sinon', () => {
    expect(tipFor('/').text).toContain('deux exercices offerts')
    expect(tipFor('/parcours').title).toBe('À votre rythme')
    expect(tipFor('/tarifs').pose).toBe('guard')
    expect(tipFor('/securite')).toBe(tipFor('/confidentialite'))
    expect(tipFor('/cabinets').link?.href).toBe('/cabinets#demo')
    expect(tipFor('/une-page-inconnue').title).toBe('Je suis là pour vous guider')
  })

  test('aucun conseil ne tutoie (le site garde le vouvoiement)', () => {
    for (const path of ['/', '/parcours', '/tarifs', '/qui-sommes-nous', '/contact', '/cgv']) {
      const { title, text } = tipFor(path)
      expect(`${title} ${text}`).not.toMatch(/(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu)
    }
  })
})

describe('CompanionAssistant', () => {
  beforeEach(() => {
    resetInertiaMock()
    window.sessionStorage.clear()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
  afterEach(() => window.sessionStorage.clear())

  test('affiche le compagnon et le conseil de la page, avec son lien', () => {
    setPageProps({}, '/tarifs')
    render(<CompanionAssistant />)

    const assistant = screen.getByRole('complementary', { name: 'Assistant jumpUjob' })
    expect(within(assistant).getByText('Sans abonnement')).toBeInTheDocument()
    expect(
      within(assistant).getByRole('link', { name: 'Lire les conditions de vente' })
    ).toHaveAttribute('href', '/cgv')
    expect(assistant.querySelector('svg[data-pose="guard"]')).not.toBeNull()
  })

  test('se replie, se rouvre, et retient le choix pour la session', async () => {
    const user = userEvent.setup()
    setPageProps({}, '/parcours')
    const { unmount } = render(<CompanionAssistant />)

    await user.click(screen.getByRole('button', { name: 'Masquer le conseil' }))
    expect(screen.queryByText('À votre rythme')).not.toBeInTheDocument()
    const robot = screen.getByRole('button', { name: 'Afficher le conseil de l’assistant' })
    expect(robot).toHaveAttribute('aria-expanded', 'false')
    expect(window.sessionStorage.getItem(ASSISTANT_COLLAPSED_KEY)).toBe('1')

    unmount()
    render(<CompanionAssistant />)
    expect(screen.queryByText('À votre rythme')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Afficher le conseil de l’assistant' }))
    expect(screen.getByText('À votre rythme')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Masquer le conseil de l’assistant' })
    ).toHaveAttribute('aria-expanded', 'true')
    expect(window.sessionStorage.getItem(ASSISTANT_COLLAPSED_KEY)).toBeNull()
  })

  test('sur mobile, démarre replié : le robot seul, un toucher pour lire le conseil', async () => {
    const user = userEvent.setup()
    const original = window.matchMedia
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    try {
      setPageProps({}, '/parcours')
      render(<CompanionAssistant />)

      expect(screen.queryByText('À votre rythme')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Afficher le conseil de l’assistant' }))
      expect(screen.getByText('À votre rythme')).toBeInTheDocument()
    } finally {
      window.matchMedia = original
    }
  })

  test('sur l’accueil, attend que le compagnon du héros soit sorti de l’écran', () => {
    setPageProps({}, '/')
    render(<CompanionAssistant />)
    expect(screen.queryByRole('complementary', { name: 'Assistant jumpUjob' })).toBeNull()

    scrollTo(900)
    expect(screen.getByRole('complementary', { name: 'Assistant jumpUjob' })).toBeInTheDocument()
    expect(screen.getByText('Par où commencer ?')).toBeInTheDocument()
  })

  test('PublicLayout l’affiche par défaut et le retire avec assistant={false}', () => {
    setPageProps({}, '/contact')
    const { rerender } = render(<PublicLayout>contenu</PublicLayout>)
    expect(screen.getByRole('complementary', { name: 'Assistant jumpUjob' })).toBeInTheDocument()

    rerender(<PublicLayout assistant={false}>contenu</PublicLayout>)
    expect(screen.queryByRole('complementary', { name: 'Assistant jumpUjob' })).toBeNull()
  })
})
