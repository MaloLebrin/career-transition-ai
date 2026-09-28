import {
  CANDIDATE_DOCUMENT_EXTENSIONS,
  CANDIDATE_DOCUMENT_MAX_SIZE,
  mediaKindValues,
} from '#shared/constants/media'
import vine from '@vinejs/vine'

export const uploadCandidateDocumentValidator = vine.create({
  document: vine.file({
    size: CANDIDATE_DOCUMENT_MAX_SIZE,
    extnames: [...CANDIDATE_DOCUMENT_EXTENSIONS],
  }),
  kind: vine.enum(mediaKindValues),
})
