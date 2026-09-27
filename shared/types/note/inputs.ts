import type { NoteVisibility } from '#shared/constants/note'

/** Données de création d'une note (payload de `createNoteValidator`). */
export interface CreateNoteInput {
  content: string
  visibility: NoteVisibility
  supportPlanStepId?: number
  exerciseResultId?: number
}

/** Modification partielle d'une note (payload de `updateNoteValidator`). */
export interface UpdateNoteInput {
  content?: string
  visibility?: NoteVisibility
}
