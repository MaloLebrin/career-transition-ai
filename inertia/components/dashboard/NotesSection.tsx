import { router } from '@inertiajs/react'
import { MessageSquarePlus, StickyNote } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import type { Note, NoteVisibility } from '~/types/Note'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmModal from '../ui/ConfirmModal'
import NoteCard from '../ui/NoteCard'
import NoteForm from '../ui/NoteForm'
import NoteModal from '../ui/NoteModal'

type NoteContext = 'general' | 'step' | 'exercise'

interface NotesSectionProps {
  employeeId: number
  context?: NoteContext
  supportPlanStepId?: number
  exerciseResultId?: number
  title?: string
  isAdvisor?: boolean
  initialNotes?: Note[]
  useModal?: boolean
}

const NotesSection = memo(function NotesSection({
  employeeId,
  context = 'general',
  supportPlanStepId,
  exerciseResultId,
  title = 'Notes',
  isAdvisor = false,
  initialNotes = [],
  useModal = true,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const [deleteState, setDeleteState] = useState<'idle' | 'loading' | 'error'>('idle')

  const fetchNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const basePath = isAdvisor
        ? `/dashboard/conseiller/employees/${employeeId}/notes`
        : '/dashboard/candidat/notes'

      const response = await fetch(basePath, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      if (response.ok) {
        const data = await response.json()
        let filteredNotes = data as Note[]

        if (context === 'step' && supportPlanStepId) {
          filteredNotes = filteredNotes.filter((n) => n.supportPlanStepId === supportPlanStepId)
        } else if (context === 'exercise' && exerciseResultId) {
          filteredNotes = filteredNotes.filter((n) => n.exerciseResultId === exerciseResultId)
        } else if (context === 'general') {
          filteredNotes = filteredNotes.filter(
            (n) => !n.supportPlanStepId && !n.exerciseResultId
          )
        }

        setNotes(filteredNotes)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [employeeId, isAdvisor, context, supportPlanStepId, exerciseResultId])

  useEffect(() => {
    if (initialNotes.length === 0) {
      fetchNotes()
    }
  }, [fetchNotes, initialNotes.length])

  const handleCreate = useCallback(
    (data: { content: string; visibility: NoteVisibility }) => {
      setIsLoading(true)
      router.post(
        `/dashboard/conseiller/employees/${employeeId}/notes`,
        {
          ...data,
          supportPlanStepId: context === 'step' ? supportPlanStepId : undefined,
          exerciseResultId: context === 'exercise' ? exerciseResultId : undefined,
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setIsAddOpen(false)
            fetchNotes()
          },
          onFinish: () => setIsLoading(false),
        }
      )
    },
    [employeeId, context, supportPlanStepId, exerciseResultId, fetchNotes]
  )

  const handleUpdate = useCallback(
    (data: { content: string; visibility: NoteVisibility }) => {
      if (!editingNote) return
      setIsLoading(true)
      router.put(
        `/dashboard/conseiller/notes/${editingNote.id}`,
        data,
        {
          preserveScroll: true,
          onSuccess: () => {
            setEditingNote(null)
            fetchNotes()
          },
          onFinish: () => setIsLoading(false),
        }
      )
    },
    [editingNote, fetchNotes]
  )

  const handleDelete = useCallback(() => {
    if (!deletingNote) return
    setDeleteState('loading')
    router.delete(`/dashboard/conseiller/notes/${deletingNote.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setNotes((prev) => prev.filter((n) => n.id !== deletingNote.id))
        setDeletingNote(null)
        setDeleteState('idle')
      },
      onError: () => setDeleteState('error'),
    })
  }, [deletingNote])

  return (
    <Card className="p-8 rounded-[32px]">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-3">
          <StickyNote className="w-5 h-5 text-brand-sage" />
          {title && <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.15em]">
            {title}
          </h3>}
        </div>
        {isAdvisor && !isAddOpen && !editingNote && (
          <Button size="xs" onClick={() => setIsAddOpen(true)}>
            <MessageSquarePlus className="w-4 h-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Mode Modal */}
      {useModal && (
        <>
          <NoteModal
            isOpen={isAddOpen}
            onSubmit={handleCreate}
            onCancel={() => setIsAddOpen(false)}
            isLoading={isLoading}
          />
          <NoteModal
            isOpen={!!editingNote}
            note={editingNote}
            onSubmit={handleUpdate}
            onCancel={() => setEditingNote(null)}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Mode Inline (pour usage dans une modale existante) */}
      {!useModal && isAddOpen && (
        <div className="mb-6 p-4 bg-brand-ivory/50 rounded-2xl">
          <NoteForm
            onSubmit={handleCreate}
            onCancel={() => setIsAddOpen(false)}
            isLoading={isLoading}
            submitLabel="Ajouter"
          />
        </div>
      )}

      {!useModal && editingNote && (
        <div className="mb-6 p-4 bg-brand-ivory/50 rounded-2xl">
          <NoteForm
            initialContent={editingNote.content}
            initialVisibility={editingNote.visibility}
            onSubmit={handleUpdate}
            onCancel={() => setEditingNote(null)}
            isLoading={isLoading}
            submitLabel="Mettre à jour"
          />
        </div>
      )}

      {isLoading && notes.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-center py-8 text-brand-navy/40 text-sm italic">Aucune note</p>
      ) : (
        <div className="space-y-4">          
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={isAdvisor ? setEditingNote : undefined}
              onDelete={isAdvisor ? setDeletingNote : undefined}
              showVisibilityBadge={isAdvisor}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingNote}
        title="Supprimer la note"
        description="Cette action est définitive."
        variant="danger"
        state={deleteState}
        confirmLabel="Supprimer"
        onCancel={() => {
          setDeletingNote(null)
          setDeleteState('idle')
        }}
        onConfirm={handleDelete}
        errorMessage="Impossible de supprimer la note."
      />
    </Card>
  )
})

NotesSection.displayName = 'NotesSection'

export default NotesSection
