import { AlertTriangle, Lock, Users } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import type { NoteVisibility } from '~/types/note'
import Button from './Button'

interface NoteFormProps {
  initialContent?: string
  initialVisibility?: NoteVisibility
  onSubmit: (data: { content: string; visibility: NoteVisibility }) => void
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

const NoteForm = memo(function NoteForm({
  initialContent = '',
  initialVisibility = 'private',
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Enregistrer',
}: NoteFormProps) {
  const [content, setContent] = useState(initialContent)
  const [visibility, setVisibility] = useState<NoteVisibility>(initialVisibility)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!content.trim()) return
      onSubmit({ content: content.trim(), visibility })
    },
    [content, visibility, onSubmit]
  )

  const isShared = visibility === 'shared'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sélection de visibilité EN PREMIER - très visible */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 block">
          Qui peut voir cette note ?
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Option Privée */}
          <button
            type="button"
            onClick={() => setVisibility('private')}
            disabled={isLoading}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
              !isShared
                ? 'bg-ink border-ink text-on-ink shadow-raised scale-[1.02]'
                : 'bg-surface border-hairline-strong text-muted hover:border-muted-soft hover:bg-surface-soft'
            }`}
          >
            <div className={`p-2 rounded-xl ${!isShared ? 'bg-on-ink/20' : 'bg-surface-soft'}`}>
              <Lock className={`w-5 h-5 ${!isShared ? 'text-on-ink' : 'text-muted-soft'}`} />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">Privée</div>
              <div
                className={`text-[10px] mt-0.5 ${!isShared ? 'text-on-ink-soft' : 'text-muted'}`}
              >
                Moi uniquement
              </div>
            </div>
            {!isShared && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-surface rounded-full flex items-center justify-center shadow">
                <div className="w-3 h-3 bg-ink rounded-full" />
              </div>
            )}
          </button>

          {/* Option Partagée */}
          <button
            type="button"
            onClick={() => setVisibility('shared')}
            disabled={isLoading}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
              isShared
                ? 'bg-tint-blossom border-tint-blossom-ink text-tint-blossom-ink shadow-raised scale-[1.02]'
                : 'bg-surface border-hairline-strong text-muted hover:border-tint-blossom-ink/30 hover:bg-tint-blossom'
            }`}
          >
            <div className={`p-2 rounded-xl ${isShared ? 'bg-surface' : 'bg-surface-soft'}`}>
              <Users
                className={`w-5 h-5 ${isShared ? 'text-tint-blossom-ink' : 'text-muted-soft'}`}
              />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">Partagée</div>
              <div
                className={`text-[10px] mt-0.5 ${isShared ? 'text-tint-blossom-ink' : 'text-muted'}`}
              >
                Visible par l'accompagné
              </div>
            </div>
            {isShared && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-surface rounded-full flex items-center justify-center shadow">
                <div className="w-3 h-3 bg-tint-blossom-bold rounded-full" />
              </div>
            )}
          </button>
        </div>

        {/* Avertissement si partagée */}
        {isShared && (
          <div className="flex items-start gap-3 p-3 bg-warning-soft border border-warning/30 rounded-xl animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning font-medium">
              Cette note sera visible par l'accompagné dans son espace personnel.
            </p>
          </div>
        )}
      </div>

      {/* Zone de texte */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 block">
          Contenu de la note
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écris ta note ici..."
          rows={4}
          className={`w-full p-4 border-2 rounded-2xl outline-none font-medium transition-all text-sm resize-none ${
            isShared
              ? 'bg-tint-blossom/40 border-tint-blossom-ink/30 focus:border-tint-blossom-ink focus:ring-2 focus:ring-tint-blossom-ink/25'
              : 'bg-surface border-hairline-strong focus:border-accent focus:ring-2 focus:ring-accent/25'
          }`}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading || !content.trim()} className="">
          {isLoading ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
})

NoteForm.displayName = 'NoteForm'

export default NoteForm
