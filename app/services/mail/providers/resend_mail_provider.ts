import type { MailMessage, MailProvider } from '#services/mail/types'
import Logger from '@adonisjs/core/services/logger'
import { Resend } from 'resend'

type ResendClient = {
  emails: {
    send: (payload: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>
  }
}

function toResendAddress(addr: { email: string; name?: string }): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

type TestEvent = 'delivered' | 'bounced' | 'complained' | 'suppressed'

function resolveDevTestMode(): boolean {
  const raw = String(process.env.MAIL_RESEND_TEST_MODE ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  // Safe default outside production: avoid accidental real sends in dev/test
  return process.env.NODE_ENV !== 'production'
}

function resolveDevTestEvent(): TestEvent {
  const raw = String(process.env.MAIL_RESEND_TEST_EVENT ?? 'delivered')
    .trim()
    .toLowerCase()
  switch (raw) {
    case 'bounced':
      return 'bounced'
    case 'complained':
      return 'complained'
    case 'suppressed':
      return 'suppressed'
    case 'delivered':
    default:
      return 'delivered'
  }
}

function resolveDevTestTo(message: MailMessage): string {
  const explicit = String(process.env.MAIL_RESEND_TEST_TO ?? '')
    .trim()
    .toLowerCase()
  if (explicit) return explicit

  const event = resolveDevTestEvent()
  if (event === 'suppressed') {
    return 'suppressed@resend.dev'
  }

  const kind =
    typeof message.metadata?.kind === 'string' ? message.metadata.kind.trim().toLowerCase() : 'mail'
  const safeLabel = kind.replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'mail'
  return `${event}+${safeLabel}@resend.dev`
}

function resolveDevTestFrom(): string {
  const explicit = String(process.env.MAIL_RESEND_TEST_FROM ?? '')
    .trim()
    .toLowerCase()
  if (explicit) return explicit
  return 'onboarding@resend.dev'
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
    const isDevTestMode = process.env.NODE_ENV !== 'production' && resolveDevTestMode()
    const resolvedTo = isDevTestMode ? [resolveDevTestTo(message)] : toList.map(toResendAddress)
    const resolvedFrom = isDevTestMode ? resolveDevTestFrom() : toResendAddress(message.from)

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
