export type MailAddress = {
  email: string
  name?: string
}

export type MailMessage = {
  to: MailAddress | MailAddress[]
  subject: string
  text?: string
  html?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>
}

