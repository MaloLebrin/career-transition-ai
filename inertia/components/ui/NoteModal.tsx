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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-2xl relative animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Modifier la note' : 'Nouvelle note'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de visibilité - très visible */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
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
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xl scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-3 rounded-2xl ${!isShared ? 'bg-white/20' : 'bg-slate-100'}`}>
                  <Lock className={`w-6 h-6 ${!isShared ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-base">Privée</div>
                  <div className={`text-xs mt-1 ${!isShared ? 'text-white/70' : 'text-slate-400'}`}>
                    Visible uniquement par moi
                  </div>
                </div>
                {!isShared && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
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
                    ? 'bg-rose-200 border-rose-200 text-rose-800 shadow-xl scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-rose-100 hover:bg-rose-50'
                }`}
              >
                <div className={`p-3 rounded-2xl ${isShared ? 'bg-rose-300/50' : 'bg-slate-100'}`}>
                  <Users className={`w-6 h-6 ${isShared ? 'text-rose-700' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-base">Partagée</div>
                  <div className={`text-xs mt-1 ${isShared ? 'text-rose-600' : 'text-slate-400'}`}>
                    Visible par l'accompagné
                  </div>
                </div>
                {isShared && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-rose-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Avertissement si partagée */}
            {isShared && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl animate-fadeIn">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-rose-800 font-semibold">Attention : note partagée</p>
                  <p className="text-xs text-rose-600 mt-0.5">
                    L'accompagné pourra lire cette note dans son espace personnel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Zone de texte - plus grande */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
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
                  ? 'bg-rose-50/50 border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                  : 'bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
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
            <Button
              type="submit"
              disabled={isLoading || !content.trim()}
              size="lg"
              className={isShared ? '!bg-rose-200 !text-rose-800 hover:!bg-rose-300' : ''}
            >
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
