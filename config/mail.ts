import env from '#start/env'
import app from '@adonisjs/core/services/app'

/**
 * Envoi d'e-mails (voir docs/MAIL.md), issue #19.
 *
 * En production, `MAIL_PROVIDER=resend` n'envoie qu'avec un domaine vérifié
 * chez Resend : sans lui, Resend restreint l'envoi à l'adresse du compte et les
 * testeurs ne reçoivent rien, sans erreur visible côté serveur avant le premier
 * envoi. `console` (repli sans domaine) n'a aucune exigence ici.
 */
export const MAIL_PRODUCTION_ENV = ['MAIL_PROVIDER', 'RESEND_API_KEY', 'MAIL_FROM_EMAIL'] as const

/** Problèmes de configuration qui empêcheraient l'envoi réel en production. */
export function mailProductionErrors(
  read: (name: (typeof MAIL_PRODUCTION_ENV)[number]) => string | undefined
): string[] {
  if (read('MAIL_PROVIDER') !== 'resend') return []

  const errors: string[] = []
  if (!read('RESEND_API_KEY')?.trim()) errors.push('RESEND_API_KEY manquante')

  const from = read('MAIL_FROM_EMAIL')?.trim().toLowerCase()
  if (!from) {
    errors.push('MAIL_FROM_EMAIL manquante')
  } else if (from.endsWith('@resend.dev')) {
    errors.push(
      'MAIL_FROM_EMAIL en @resend.dev : domaine non vérifié, envoi restreint à l’adresse du compte Resend'
    )
  }
  return errors
}

const errors = mailProductionErrors((name) => env.get(name))
if (app.inProduction && errors.length > 0) {
  throw new Error(`Mail : ${errors.join(' ; ')} (voir docs/MAIL.md)`)
}

const mailConfig = {
  provider: env.get('MAIL_PROVIDER') ?? 'console',
}

export default mailConfig
