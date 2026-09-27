import type { MailMessage } from '#services/mail/types'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

export function toResendAddress(addr: { email: string; name?: string }): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

type TestEvent = 'delivered' | 'bounced' | 'complained' | 'suppressed'

export function resolveDevTestMode(): boolean {
  // Booléen validé au boot, ou chaîne posée ensuite via `env.set`
  const raw = String(env.get('MAIL_RESEND_TEST_MODE') ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  // Safe default outside production: avoid accidental real sends in dev/test
  return !app.inProduction
}

export function resolveDevTestEvent(): TestEvent {
  const raw = String(env.get('MAIL_RESEND_TEST_EVENT') || 'delivered')
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

export function resolveDevTestTo(message: MailMessage): string {
  const explicit = String(env.get('MAIL_RESEND_TEST_TO') || '')
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

export function resolveDevTestFrom(): string {
  const explicit = String(env.get('MAIL_RESEND_TEST_FROM') || '')
    .trim()
    .toLowerCase()
  if (explicit) return explicit
  return 'onboarding@resend.dev'
}

export function resolveResendApiKey(): string {
  const key = String(env.get('RESEND_API_KEY') || '').trim()
  if (!key) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=resend.')
  }
  return key
}
