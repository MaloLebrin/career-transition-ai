import { Pencil, Trash2, Lock, Users } from 'lucide-react'
import { memo } from 'react'
import type { Note } from '~/types/note'

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
          ? 'bg-tint-blossom border-2 border-tint-blossom-ink/20'
          : 'bg-surface-soft border border-hairline'
      }`}
    >
      {/* Indicateur de visibilité - très visible */}
      {showVisibilityBadge && (
        <div
          className={`absolute -top-2 -left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
            isShared ? 'bg-tint-blossom-ink text-on-ink' : 'bg-ink text-on-ink'
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
              isShared ? 'bg-surface text-tint-blossom-ink' : 'bg-surface-strong text-ink-soft'
            }`}
          >
            {note.authorName.charAt(0).toUpperCase()}
          </div>
          <span
            className={`text-xs font-semibold ${isShared ? 'text-tint-blossom-ink' : 'text-muted'}`}
          >
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
                    ? 'text-tint-blossom-ink hover:bg-surface'
                    : 'text-muted hover:text-ink hover:bg-surface-strong'
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
                className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className={`text-sm whitespace-pre-wrap leading-relaxed text-ink-soft`}>{note.content}</p>

      <div className={`mt-3 flex items-center gap-2 text-[10px] text-muted`}>
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
