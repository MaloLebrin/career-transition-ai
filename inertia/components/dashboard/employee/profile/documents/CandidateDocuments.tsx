import {
  CANDIDATE_DOCUMENT_EXTENSIONS,
  CANDIDATE_DOCUMENT_MAX_SIZE,
  MAX_CANDIDATE_DOCUMENTS,
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  type MediaKind,
} from '#shared/constants/media'
import { formatFileSize } from '#shared/helpers/media'
import type { CandidateDocumentsProps } from '#shared/types/media/documents'
import { router, useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import SelectField from '~/components/ui/SelectField'

const ACCEPT = CANDIDATE_DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',')

const KIND_OPTIONS = Object.values(MEDIA_KINDS).map((kind) => ({
  value: kind,
  label: MEDIA_KIND_LABELS[kind],
}))

/**
 * Documents du candidat (issue #50) : liste, dépôt, téléchargement et
 * suppression. Partagé par le profil candidat et la fiche conseiller
 * (`baseUrl` désigne les routes du bon espace).
 */
export const CandidateDocuments = ({ documents, baseUrl }: CandidateDocumentsProps) => {
  const form = useForm<{ document: File | null; kind: MediaKind }>({
    document: null,
    kind: MEDIA_KINDS.OTHER,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const limitReached = documents.length >= MAX_CANDIDATE_DOCUMENTS

  const resetFile = () => {
    form.reset('document')
    if (inputRef.current) inputRef.current.value = ''
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    form.post(baseUrl, { forceFormData: true, preserveScroll: true, onSuccess: resetFile })
  }

  const remove = (id: number) => {
    router.delete(`${baseUrl}/${id}`, {
      preserveScroll: true,
      onStart: () => setDeletingId(id),
      onFinish: () => setDeletingId(null),
    })
  }

  return (
    <Card className="p-10 rounded-[40px]">
      <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
        Documents
      </h2>

      {documents.length === 0 ? (
        <p className="text-brand-navy/50 italic mb-8">Aucun document déposé.</p>
      ) : (
        <ul className="divide-y divide-brand-navy/5 mb-8">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-brand-navy truncate">
                  {document.originalFilename}
                </p>
                <p className="text-xs text-brand-navy/50">
                  {MEDIA_KIND_LABELS[document.kind]} · {formatFileSize(document.bytes)} ·{' '}
                  {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                  {document.uploadedByName && ` · déposé par ${document.uploadedByName}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`${baseUrl}/${document.id}`}
                  className="text-xs font-bold text-brand-sage hover:underline"
                  download
                >
                  Télécharger
                </a>
                {document.canDelete && (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => remove(document.id)}
                    isLoading={deletingId === document.id}
                    aria-label={`Supprimer ${document.originalFilename}`}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {limitReached ? (
        <p className="text-xs text-brand-navy/60" role="status">
          Limite de {MAX_CANDIDATE_DOCUMENTS} documents atteinte : supprimez-en un pour en ajouter.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="candidate-document"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2"
            >
              Fichier
            </label>
            <input
              id="candidate-document"
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => form.setData('document', e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-brand-navy/70"
            />
          </div>
          <SelectField
            label="Type"
            options={KIND_OPTIONS}
            value={form.data.kind}
            onChange={(kind) => form.setData('kind', kind)}
            error={form.errors.kind}
          />
          <Button
            type="submit"
            size="sm"
            isLoading={form.processing}
            disabled={!form.data.document || form.processing}
          >
            Ajouter
          </Button>
          {form.errors.document && (
            <p className="md:col-span-3 text-xs font-bold text-rose-500" role="alert">
              {form.errors.document}
            </p>
          )}
          <p className="md:col-span-3 text-xs text-slate-500">
            PDF, Word ou image, {CANDIDATE_DOCUMENT_MAX_SIZE.replace('mb', ' Mo')} maximum. Les
            documents sont privés : seuls vous et votre conseiller y avez accès.
          </p>
        </form>
      )}
    </Card>
  )
}
