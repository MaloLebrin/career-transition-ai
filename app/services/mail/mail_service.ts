import { ConsoleMailProvider } from '#services/mail/providers/console_mail_provider'
import type { MailMessage, MailProvider } from '#services/mail/types'
import { inject } from '@adonisjs/core'

export type MailProviderName = 'console'

function resolveProviderName(): MailProviderName {
  const raw = String(process.env.MAIL_PROVIDER ?? 'console')
    .trim()
    .toLowerCase()
  if (raw === 'console') return 'console'
  return 'console'
}

function createProvider(name: MailProviderName): MailProvider {
  switch (name) {
    case 'console':
    default:
      return new ConsoleMailProvider()
  }
}

/**
 * Very small abstraction around outbound email.
 * - Provider is chosen via MAIL_PROVIDER (default: console)
 * - The rest of the app should only depend on MailService, not provider SDKs.
 */
@inject()
export class MailService {
  private provider: MailProvider

  constructor() {
    this.provider = createProvider(resolveProviderName())
  }

  /**
   * Helper for tests / special cases where you want to override
   * the underlying provider without relying on DI/container.
   */
  static withProvider(provider: MailProvider): MailService {
    const svc = new MailService()
    svc.provider = provider
    return svc
  }

  async send(message: MailMessage): Promise<void> {
    await this.provider.send(message)
  }
}
