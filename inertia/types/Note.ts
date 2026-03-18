export type NoteVisibility = 'private' | 'shared'

export interface Note {
  id: number
  content: string
  visibility: NoteVisibility
  appointmentId: number | null
  exerciseResultId: number | null
  authorId?: number
  authorName: string
  createdAt: string
  updatedAt: string
  canEdit: boolean
}
