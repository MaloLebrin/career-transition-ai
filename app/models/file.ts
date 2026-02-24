export const FILES_TYPES = {
  CV: 'cv',
  COVER_LETTER: 'cover_letter',
  CERTIFICATE: 'certificate',
  DIPLOMA: 'diploma',
  OTHER: 'other',
} as const

export type FileType = (typeof FILES_TYPES)[keyof typeof FILES_TYPES]

export const filesTypesValues = Object.values(FILES_TYPES)
