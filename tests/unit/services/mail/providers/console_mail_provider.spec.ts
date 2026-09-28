import { ConsoleMailProvider } from '#services/mail/providers/console_mail_provider'
import type { MailMessage } from '#services/mail/types'
import { test } from '@japa/runner'
import { format } from 'node:util'

/**
 * Le fournisseur écrit via `console.info` : on le capture (sans bruit dans la
 * sortie des tests) en formatant les arguments comme le ferait la console.
 */
function captureConsoleInfo(cleanup: (fn: () => void) => void): string[] {
  const lines: string[] = []
  const original = console.info
  console.info = (...args: unknown[]) => {
    lines.push(format(...args))
  }
  cleanup(() => {
    console.info = original
  })
  return lines
}

const base: MailMessage = {
  from: { email: 'noreply@example.com' },
  to: { email: 'claire@example.com', name: 'Claire' },
  subject: 'Bienvenue',
}

test.group('ConsoleMailProvider', () => {
  test('journalise destinataire (nom + e-mail) et sujet, puis le texte', async ({
    assert,
    cleanup,
  }) => {
    const lines = captureConsoleInfo(cleanup)

    await new ConsoleMailProvider().send({ ...base, text: 'Bonjour' })

    assert.deepEqual(lines, [
      '[Mail] to=Claire <claire@example.com> subject=Bienvenue',
      '[Mail] text=Bonjour',
    ])
  })

  test('plusieurs destinataires, avec ou sans nom, séparés par des virgules', async ({
    assert,
    cleanup,
  }) => {
    const lines = captureConsoleInfo(cleanup)

    await new ConsoleMailProvider().send({
      ...base,
      to: [{ email: 'a@example.com', name: 'A' }, { email: 'b@example.com' }],
    })

    assert.deepEqual(lines, ['[Mail] to=A <a@example.com>, b@example.com subject=Bienvenue'])
  })

  test("sans texte, seule la ligne d'en-tête est écrite (le HTML n'est pas journalisé)", async ({
    assert,
    cleanup,
  }) => {
    const lines = captureConsoleInfo(cleanup)

    await new ConsoleMailProvider().send({ ...base, html: '<p>secret</p>' })

    assert.lengthOf(lines, 1)
    assert.notInclude(lines[0], 'secret')
  })
})
