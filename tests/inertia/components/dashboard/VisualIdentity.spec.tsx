import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { VisualIdentity } from '../../../../inertia/components/dashboard/settings/organisation/visual-identity/VisualIdentity'

const post = vi.fn()
const routerDelete = vi.fn()
let formData: { logo: File | null } = { logo: null }
let formErrors: Record<string, string> = {}

vi.mock('@inertiajs/react', () => ({
  router: { delete: (...args: unknown[]) => routerDelete(...args) },
  useForm: () => ({
    data: formData,
    setData: (key: 'logo', value: File | null) => {
      formData = { ...formData, [key]: value }
    },
    post,
    reset: vi.fn(),
    processing: false,
    errors: formErrors,
  }),
}))

const ORG = { id: 1, name: 'Mon Cabinet', slug: 'mon-cabinet', createdAt: '2025-01-01T00:00:00Z' }
const LOGO_ROUTE = '/dashboard/conseiller/settings/organization/logo'

describe('VisualIdentity', () => {
  beforeEach(() => {
    post.mockReset()
    routerDelete.mockReset()
    formData = { logo: null }
    formErrors = {}
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  test('affiche le logo actuel et permet de le supprimer', () => {
    render(<VisualIdentity organization={{ ...ORG, logoUrl: 'https://res.test/logo.png' }} />)

    expect(screen.getByAltText('Logo du cabinet')).toHaveAttribute(
      'src',
      'https://res.test/logo.png'
    )
    fireEvent.click(screen.getByText('Supprimer le logo'))
    expect(routerDelete).toHaveBeenCalledWith(
      LOGO_ROUTE,
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('sans logo : pas de bouton de suppression, carte active', () => {
    render(<VisualIdentity organization={ORG} />)

    expect(screen.queryByText('Supprimer le logo')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Logo du cabinet')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Choisir un logo')).not.toBeDisabled()
  })

  test('limite le sélecteur aux formats acceptés', () => {
    render(<VisualIdentity organization={ORG} />)

    expect(screen.getByTestId('logo-input')).toHaveAttribute('accept', '.jpg,.jpeg,.png,.webp,.svg')
  })

  test('fichier choisi : aperçu puis envoi en multipart', () => {
    formData = { logo: new File(['png'], 'logo.png', { type: 'image/png' }) }
    render(<VisualIdentity organization={{ ...ORG, logoUrl: 'https://res.test/old.png' }} />)

    expect(screen.getByAltText('Logo du cabinet')).toHaveAttribute('src', 'blob:preview')
    expect(screen.queryByText('Supprimer le logo')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Enregistrer le logo'))
    expect(post).toHaveBeenCalledWith(
      LOGO_ROUTE,
      expect.objectContaining({ forceFormData: true, preserveScroll: true })
    )
  })

  test('affiche l’erreur de validation du fichier', () => {
    formErrors = { logo: 'Le fichier est trop volumineux' }
    render(<VisualIdentity organization={ORG} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Le fichier est trop volumineux')
  })

  /** #61 : un conseiller ou un expert voit le logo sans pouvoir le changer. */
  test('lecture seule : logo affiché, aucune action', () => {
    render(
      <VisualIdentity organization={{ ...ORG, logoUrl: 'https://res.test/logo.png' }} readOnly />
    )

    expect(screen.getByAltText('Logo du cabinet')).toBeInTheDocument()
    expect(screen.queryByLabelText('Choisir un logo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('logo-input')).not.toBeInTheDocument()
    expect(screen.queryByText('Supprimer le logo')).not.toBeInTheDocument()
    expect(screen.getByText(/Seul un administrateur du cabinet/)).toBeInTheDocument()
  })
})
