import { CHAT_MESSAGE_MAX } from '#shared/constants/chat'
import vine from '@vinejs/vine'

/** Message du chat candidat ↔ expert : texte obligatoire, nettoyé, 2000 caractères au plus. */
export const sendChatMessageValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(CHAT_MESSAGE_MAX),
})
