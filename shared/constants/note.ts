export const NOTE_VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
} as const

export type NoteVisibility = (typeof NOTE_VISIBILITY)[keyof typeof NOTE_VISIBILITY]

export const noteVisibilityValues = Object.values(NOTE_VISIBILITY)
