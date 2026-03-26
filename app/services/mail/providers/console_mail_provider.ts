import type { MailMessage, MailProvider } from '#services/mail/types'

export class ConsoleMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    const toList = Array.isArray(message.to) ? message.to : [message.to]
    const to = toList.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email)).join(', ')
    // Intentionally minimal, provider-agnostic
    console.info('[Mail] to=%s subject=%s', to, message.subject)
    if (message.text) {
      console.info('[Mail] text=%s', message.text)
    }
  }
}

