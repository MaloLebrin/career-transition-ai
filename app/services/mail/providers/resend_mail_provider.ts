import type { MailMessage, MailProvider } from '#services/mail/types'
import {
  resolveDevTestFrom,
  resolveDevTestMode,
  resolveDevTestTo,
  resolveResendApiKey,
  toResendAddress,
} from '#utils/mail/resend'
import app from '@adonisjs/core/services/app'
import Logger from '@adonisjs/core/services/logger'
import { Resend } from 'resend'

type ResendClient = {
  emails: {
    send: (payload: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>
  }
}

export class ResendMailProvider implements MailProvider {
  private client: ResendClient

  constructor(client?: ResendClient) {
    this.client = client ?? (new Resend(resolveResendApiKey()) as any)
  }

  async send(message: MailMessage): Promise<void> {
    const toList = Array.isArray(message.to) ? message.to : [message.to]
    const isDevTestMode = !app.inProduction && resolveDevTestMode()
    const resolvedTo = isDevTestMode ? [resolveDevTestTo(message)] : toList.map(toResendAddress)
    const resolvedFrom = isDevTestMode
      ? resolveDevTestFrom()
      : 'Contact <contact@careertransition.fr>'

    if (isDevTestMode) {
      Logger.info(
        {
          originalFrom: toResendAddress(message.from),
          testFrom: resolvedFrom,
          originalTo: toList.map((to) => to.email),
          testTo: resolvedTo[0],
        },
        'Resend dev test mode enabled: routing email to Resend test inbox'
      )
    }

    const payload: Record<string, unknown> = {
      from: resolvedFrom,
      to: resolvedTo,
      subject: message.subject,
    }

    if (message.html) payload.html = message.html
    if (message.text) payload.text = message.text

    if (!payload.html && !payload.text) {
      throw new Error('MailMessage must include at least one of: text, html.')
    }

    if (message.tags?.length) {
      payload.tags = message.tags.map((t) => ({ name: 'tag', value: t }))
    }

    if (message.metadata && Object.keys(message.metadata).length) {
      payload.headers = {
        'X-Mail-Metadata': JSON.stringify(message.metadata),
      }
    }

    const { error } = await this.client.emails.send(payload)
    if (error) {
      Logger.error(error)
      throw new Error('Resend provider failed to send email.')
    }
  }
}
