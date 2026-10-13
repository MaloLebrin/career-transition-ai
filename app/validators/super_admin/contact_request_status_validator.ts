import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import vine from '@vinejs/vine'

/** Changement de statut d'une demande de contact (traitée, archivée, ou remise en attente). */
export const contactRequestStatusValidator = vine.create({
  status: vine.enum(Object.values(CONTACT_REQUEST_STATUSES)),
})
