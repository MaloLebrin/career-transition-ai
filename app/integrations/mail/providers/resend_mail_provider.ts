import type { MailMessage, MailProvider } from '#integrations/mail/types'
import { Resend } from 'resend'

type ResendClient = {
  emails: {
    send: (payload: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>
  }
}

function toResendAddress(addr: { email: string; name?: string }): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

function resolveResendApiKey(): string {
  const key = String(process.env.RESEND_API_KEY ?? '').trim()
  if (!key) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=resend.')
  }
  return key
}

export class ResendMailProvider implements MailProvider {
  private client: ResendClient

  constructor(client?: ResendClient) {
    this.client = client ?? (new Resend(resolveResendApiKey()) as any)
  }

  async send(message: MailMessage): Promise<void> {
    const toList = Array.isArray(message.to) ? message.to : [message.to]

    const payload: Record<string, unknown> = {
      from: toResendAddress(message.from),
      to: toList.map(toResendAddress),
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
      throw new Error('Resend provider failed to send email.')
    }
  }
}

