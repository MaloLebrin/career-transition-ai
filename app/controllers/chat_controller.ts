import { ChatService } from '#services/chat_service'
import { chatMessagesPageValidator } from '#validators/chat/messages_page_validator'
import { sendChatMessageValidator } from '#validators/chat/send_message_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Chat candidat ↔ expert, côté candidat : une seule conversation. */
@inject()
export default class ChatController {
  constructor(private chat: ChatService) {}

  /** GET /dashboard/candidat/chat?before=<id> */
  public async show({ auth, request, inertia }: HttpContext) {
    const { before } = await chatMessagesPageValidator.validate(request.qs())
    return inertia.render(
      'dashboard/candidat/chat/Index',
      await this.chat.candidatePage(auth.getUserOrFail(), before ?? null)
    )
  }

  /** POST /dashboard/candidat/chat/messages */
  public async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(sendChatMessageValidator)
    await this.chat.sendAsCandidate(auth.getUserOrFail(), payload)
    return response.redirect().back()
  }

  /** POST /dashboard/candidat/chat/read */
  public async read({ auth, response }: HttpContext) {
    await this.chat.markReadAsCandidate(auth.getUserOrFail())
    return response.redirect().back()
  }
}
