import { ChatService } from '#services/chat_service'
import { chatMessagesPageValidator } from '#validators/chat/messages_page_validator'
import { sendChatMessageValidator } from '#validators/chat/send_message_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/** Chat candidat ↔ expert, côté équipe d'experts de la plateforme. */
@inject()
export default class ExpertChatController {
  constructor(private chat: ChatService) {}

  /** GET /dashboard/conseiller/chat */
  public async index({ auth, inertia }: HttpContext) {
    return inertia.render('dashboard/conseiller/chat/Index', {
      conversations: await this.chat.listForExpert(auth.getUserOrFail()),
    })
  }

  /** GET /dashboard/conseiller/chat/:id?before=<id> */
  public async show({ auth, params, request, inertia }: HttpContext) {
    const { before } = await chatMessagesPageValidator.validate(request.qs())
    return inertia.render(
      'dashboard/conseiller/chat/Show',
      await this.chat.expertPage(auth.getUserOrFail(), Number(params.id), before ?? null)
    )
  }

  /** POST /dashboard/conseiller/chat/:id/messages */
  public async store({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(sendChatMessageValidator)
    await this.chat.sendAsExpert(auth.getUserOrFail(), Number(params.id), payload)
    return response.redirect().back()
  }

  /** POST /dashboard/conseiller/chat/:id/claim */
  public async claim({ auth, params, response, session }: HttpContext) {
    await this.chat.claim(auth.getUserOrFail(), Number(params.id))
    session.flash('success', 'Conversation prise en charge.')
    return response.redirect().back()
  }

  /** POST /dashboard/conseiller/chat/:id/read */
  public async read({ auth, params, response }: HttpContext) {
    await this.chat.markReadAsExpert(auth.getUserOrFail(), Number(params.id))
    return response.redirect().back()
  }
}
