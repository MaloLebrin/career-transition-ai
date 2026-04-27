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
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">
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
                ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-xl ${!isShared ? 'bg-white/20' : 'bg-slate-100'}`}>
              <Lock className={`w-5 h-5 ${!isShared ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">Privée</div>
              <div className={`text-[10px] mt-0.5 ${!isShared ? 'text-white/70' : 'text-slate-400'}`}>
                Moi uniquement
              </div>
            </div>
            {!isShared && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                <div className="w-3 h-3 bg-slate-800 rounded-full" />
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
                ? 'bg-rose-200 border-rose-200 text-rose-800 shadow-lg scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-500 hover:border-rose-100 hover:bg-rose-50'
            }`}
          >
            <div className={`p-2 rounded-xl ${isShared ? 'bg-rose-300/50' : 'bg-slate-100'}`}>
              <Users className={`w-5 h-5 ${isShared ? 'text-rose-700' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <div className="font-bold text-sm">Partagée</div>
              <div className={`text-[10px] mt-0.5 ${isShared ? 'text-rose-600' : 'text-slate-400'}`}>
                Visible par l'accompagné
              </div>
            </div>
            {isShared && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                <div className="w-3 h-3 bg-rose-300 rounded-full" />
              </div>
            )}
          </button>
        </div>

        {/* Avertissement si partagée */}
        {isShared && (
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium">
              Cette note sera visible par l'accompagné dans son espace personnel.
            </p>
          </div>
        )}
      </div>

      {/* Zone de texte */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">
          Contenu de la note
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écris ta note ici..."
          rows={4}
          className={`w-full p-4 border-2 rounded-2xl outline-none font-medium transition-all text-sm resize-none ${
            isShared
              ? 'bg-rose-50/50 border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
              : 'bg-white border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
          }`}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !content.trim()}
          className={isShared ? '!bg-rose-200 !text-rose-800 hover:!bg-rose-300' : ''}
        >
          {isLoading ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
})

NoteForm.displayName = 'NoteForm'

export default NoteForm
