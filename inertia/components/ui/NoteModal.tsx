import { AlertTriangle, Lock, Users, X } from 'lucide-react'
import { memo, useState, useCallback } from 'react'
import type { Note, NoteVisibility } from '~/types/note'
import Button from './Button'
import Card from './Card'

interface NoteModalProps {
  isOpen: boolean
  note?: Note | null
  onSubmit: (data: { content: string; visibility: NoteVisibility }) => void
  onCancel: () => void
  isLoading?: boolean
}

const NoteModal = memo(function NoteModal({
  isOpen,
  note,
  onSubmit,
  onCancel,
  isLoading = false,
}: NoteModalProps) {
  const [content, setContent] = useState(note?.content ?? '')
  const [visibility, setVisibility] = useState<NoteVisibility>(note?.visibility ?? 'private')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!content.trim()) return
      onSubmit({ content: content.trim(), visibility })
    },
    [content, visibility, onSubmit]
  )

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onCancel()
    }
  }, [isLoading, onCancel])

  const isShared = visibility === 'shared'
  const isEditing = !!note

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-2xl relative animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">
            {isEditing ? 'Modifier la note' : 'Nouvelle note'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-soft transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de visibilité - très visible */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">
              Qui peut voir cette note ?
            </label>

            <div className="grid grid-cols-2 gap-4">
              {/* Option Privée */}
              <button
                type="button"
                onClick={() => setVisibility('private')}
                disabled={isLoading}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                  !isShared
                    ? 'bg-ink border-ink text-on-ink shadow-raised scale-[1.02]'
                    : 'bg-surface border-hairline-strong text-muted hover:border-muted-soft hover:bg-surface-soft'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl ${!isShared ? 'bg-on-ink/20' : 'bg-surface-soft'}`}
                >
                  <Lock className={`w-6 h-6 ${!isShared ? 'text-on-ink' : 'text-muted-soft'}`} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-base">Privée</div>
                  <div className={`text-xs mt-1 ${!isShared ? 'text-on-ink-soft' : 'text-muted'}`}>
                    Visible uniquement par moi
                  </div>
                </div>
                {!isShared && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-surface rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-ink rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-surface rounded-full" />
                    </div>
                  </div>
                )}
              </button>

              {/* Option Partagée */}
              <button
                type="button"
                onClick={() => setVisibility('shared')}
                disabled={isLoading}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isShared
                    ? 'bg-tint-blossom border-tint-blossom-ink text-tint-blossom-ink shadow-raised scale-[1.02]'
                    : 'bg-surface border-hairline-strong text-muted hover:border-tint-blossom-ink/30 hover:bg-tint-blossom'
                }`}
              >
                <div className={`p-3 rounded-2xl ${isShared ? 'bg-surface' : 'bg-surface-soft'}`}>
                  <Users
                    className={`w-6 h-6 ${isShared ? 'text-tint-blossom-ink' : 'text-muted-soft'}`}
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-base">Partagée</div>
                  <div
                    className={`text-xs mt-1 ${isShared ? 'text-tint-blossom-ink' : 'text-muted'}`}
                  >
                    Visible par l'accompagné
                  </div>
                </div>
                {isShared && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-surface rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-tint-blossom-bold rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-surface rounded-full" />
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Avertissement si partagée */}
            {isShared && (
              <div className="flex items-start gap-3 p-4 bg-warning-soft border-2 border-warning/30 rounded-2xl animate-fadeIn">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-warning font-semibold">Attention : note partagée</p>
                  <p className="text-xs text-warning mt-0.5">
                    L'accompagné pourra lire cette note dans son espace personnel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Zone de texte - plus grande */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">
              Contenu de la note
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris ta note ici..."
              rows={8}
              autoFocus
              className={`w-full p-5 border-2 rounded-2xl outline-none font-medium transition-all text-base resize-none leading-relaxed ${
                isShared
                  ? 'bg-tint-blossom/40 border-tint-blossom-ink/30 focus:border-tint-blossom-ink focus:ring-2 focus:ring-tint-blossom-ink/25'
                  : 'bg-surface-soft border-hairline-strong focus:border-accent focus:ring-2 focus:ring-accent/25'
              }`}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              size="lg"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()} size="lg" className="">
              {isLoading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter la note'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
})

NoteModal.displayName = 'NoteModal'

export default NoteModal
