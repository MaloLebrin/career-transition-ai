import { Pencil, Trash2, Lock, Users } from 'lucide-react'
import { memo } from 'react'
import type { Note } from '~/types/Note'

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (note: Note) => void
  showVisibilityBadge?: boolean
}

const NoteCard = memo(function NoteCard({
  note,
  onEdit,
  onDelete,
  showVisibilityBadge = true,
}: NoteCardProps) {
  const formattedDate = new Date(note.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const isUpdated = note.updatedAt !== note.createdAt
  const formattedUpdateDate = isUpdated
    ? new Date(note.updatedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const isShared = note.visibility === 'shared'

  return (
    <div
      className={`group relative rounded-2xl p-5 transition-all hover:shadow-md ${
        isShared
          ? 'bg-rose-50 border-2 border-rose-200'
          : 'bg-slate-50 border border-slate-200'
      }`}
    >
      {/* Indicateur de visibilité - très visible */}
      {showVisibilityBadge && (
        <div
          className={`absolute -top-2 -left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
            isShared
              ? 'bg-rose-200 text-rose-800'
              : 'bg-slate-700 text-white'
          }`}
        >
          {isShared ? (
            <>
              <Users className="w-3 h-3" />
              <span>Partagée</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              <span>Privée</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mt-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isShared ? 'bg-rose-200 text-rose-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {note.authorName.charAt(0).toUpperCase()}
          </div>
          <span className={`text-xs font-semibold ${isShared ? 'text-rose-800' : 'text-slate-600'}`}>
            {note.authorName}
          </span>
        </div>

        {note.canEdit && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(note)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  isShared
                    ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                }`}
                title="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(note)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isShared ? 'text-rose-900' : 'text-slate-700'}`}>
        {note.content}
      </p>

      <div className={`mt-3 flex items-center gap-2 text-[10px] ${isShared ? 'text-rose-500' : 'text-slate-400'}`}>
        <span>{formattedDate}</span>
        {formattedUpdateDate && (
          <>
            <span>·</span>
            <span>Modifié le {formattedUpdateDate}</span>
          </>
        )}
      </div>
    </div>
  )
})

NoteCard.displayName = 'NoteCard'

export default NoteCard
