import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { CandidateDocumentDto } from '#shared/types/media/documents'
import { CandidateDocuments } from '../../../../../inertia/components/dashboard/employee/profile/documents/CandidateDocuments'

const post = vi.fn()
const routerDelete = vi.fn()
let formData: { document: File | null; kind: string } = { document: null, kind: 'other' }
let formErrors: Record<string, string> = {}

vi.mock('@inertiajs/react', () => ({
  router: { delete: (...args: unknown[]) => routerDelete(...args) },
  useForm: () => ({
    data: formData,
    setData: vi.fn(),
    post,
    reset: vi.fn(),
    processing: false,
    errors: formErrors,
  }),
}))

const BASE = '/dashboard/candidat/documents'

function doc(overrides: Partial<CandidateDocumentDto> = {}): CandidateDocumentDto {
  return {
    id: 1,
    kind: 'cv',
    originalFilename: 'CV Élodie.pdf',
    format: 'pdf',
    bytes: 1536,
    createdAt: '2026-09-01T10:00:00.000Z',
    uploadedByName: 'Élodie',
    canDelete: true,
    ...overrides,
  }
}

describe('CandidateDocuments', () => {
  beforeEach(() => {
    post.mockReset()
    routerDelete.mockReset()
    formData = { document: null, kind: 'other' }
    formErrors = {}
  })

  test('liste vide', () => {
    render(<CandidateDocuments documents={[]} baseUrl={BASE} />)

    expect(screen.getByText('Aucun document déposé.')).toBeInTheDocument()
  })

  test('affiche chaque document avec son type, sa taille et un lien de téléchargement', () => {
    render(<CandidateDocuments documents={[doc()]} baseUrl={BASE} />)

    expect(screen.getByText('CV Élodie.pdf')).toBeInTheDocument()
    expect(screen.getByText(/CV · 1,5 Ko/)).toBeInTheDocument()
    expect(screen.getByText(/déposé par Élodie/)).toBeInTheDocument()
    expect(screen.getByText('Télécharger').closest('a')).toHaveAttribute('href', `${BASE}/1`)
  })

  test('suppression via Inertia, seulement si autorisée', () => {
    render(
      <CandidateDocuments
        documents={[doc(), doc({ id: 2, originalFilename: 'Rapport.pdf', canDelete: false })]}
        baseUrl={BASE}
      />
    )

    expect(screen.queryByLabelText('Supprimer Rapport.pdf')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Supprimer CV Élodie.pdf'))
    expect(routerDelete).toHaveBeenCalledWith(
      `${BASE}/1`,
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('dépôt en multipart vers la base des routes', () => {
    formData = { document: new File(['%PDF'], 'lettre.pdf'), kind: 'cover_letter' }
    render(
      <CandidateDocuments documents={[]} baseUrl="/dashboard/conseiller/employees/7/documents" />
    )

    fireEvent.click(screen.getByText('Ajouter'))

    expect(post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/7/documents',
      expect.objectContaining({ forceFormData: true, preserveScroll: true })
    )
  })

  test('bouton d’ajout désactivé sans fichier, formats acceptés sur le sélecteur', () => {
    render(<CandidateDocuments documents={[]} baseUrl={BASE} />)

    expect(screen.getByText('Ajouter').closest('button')).toBeDisabled()
    expect(screen.getByLabelText('Fichier')).toHaveAttribute(
      'accept',
      '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp'
    )
  })

  test('erreur de validation du fichier', () => {
    formErrors = { document: 'Type de fichier non autorisé' }
    render(<CandidateDocuments documents={[]} baseUrl={BASE} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Type de fichier non autorisé')
  })

  test('limite atteinte : plus de formulaire de dépôt', () => {
    const documents = Array.from({ length: 30 }, (_, i) => doc({ id: i + 1 }))
    render(<CandidateDocuments documents={documents} baseUrl={BASE} />)

    expect(screen.getByRole('status')).toHaveTextContent('Limite de 30 documents atteinte')
    expect(screen.queryByText('Ajouter')).not.toBeInTheDocument()
  })
})
