/**
 * Historique : types de l'ancienne table `files` (supprimée par la migration
 * `1779700000000_drop_files_table`, issue #50). Conservé uniquement pour les
 * migrations déjà jouées qui l'importent — ne pas utiliser : voir
 * `shared/constants/media.ts`.
 */
export const FILES_TYPES = {
  CV: 'cv',
  COVER_LETTER: 'cover_letter',
  CERTIFICATE: 'certificate',
  DIPLOMA: 'diploma',
  OTHER: 'other',
} as const

export type FileType = (typeof FILES_TYPES)[keyof typeof FILES_TYPES]

export const filesTypesValues = Object.values(FILES_TYPES)
