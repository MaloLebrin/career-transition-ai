import type { MailMessage } from '#services/mail/types'
import { overrideEnv } from '#tests/utils/env'
import {
  resolveDevTestEvent,
  resolveDevTestFrom,
  resolveDevTestMode,
  resolveDevTestTo,
  resolveResendApiKey,
  toResendAddress,
} from '#utils/mail/resend'
import { test } from '@japa/runner'

/**
 * Helpers purs du fournisseur Resend : ils ne lisent que l'env et ne font
 * aucun appel réseau (le client Resend est injecté dans
 * `ResendMailProvider`, cf. tests/unit/services/mail/resend_mail_provider.spec.ts).
 */

function message(metadata?: Record<string, unknown>): MailMessage {
  return {
    from: { email: 'from@example.com' },
    to: { email: 'to@example.com' },
    subject: 'Sujet',
    metadata,
  }
}

const RESET_TEST_ENV = {
  MAIL_RESEND_TEST_MODE: undefined,
  MAIL_RESEND_TEST_EVENT: undefined,
  MAIL_RESEND_TEST_TO: undefined,
  MAIL_RESEND_TEST_FROM: undefined,
}

test.group('utils/mail/resend — toResendAddress', () => {
  test('formate « Nom <email> » quand un nom est fourni', ({ assert }) => {
    assert.equal(
      toResendAddress({ email: 'marie@example.com', name: 'Marie Martin' }),
      'Marie Martin <marie@example.com>'
    )
  })

  test('renvoie l’adresse seule sans nom (ou nom vide)', ({ assert }) => {
    assert.equal(toResendAddress({ email: 'marie@example.com' }), 'marie@example.com')
    assert.equal(toResendAddress({ email: 'marie@example.com', name: '' }), 'marie@example.com')
  })
})

test.group('utils/mail/resend — resolveDevTestMode', () => {
  test('« true » / « 1 » activent le mode test, quelle que soit la casse', ({
    assert,
    cleanup,
  }) => {
    for (const raw of ['true', 'TRUE', ' 1 ']) {
      const restore = overrideEnv({ MAIL_RESEND_TEST_MODE: raw })
      cleanup(restore)
      assert.isTrue(resolveDevTestMode(), raw)
      restore()
    }
  })

  test('« false » / « 0 » le désactivent explicitement', ({ assert, cleanup }) => {
    for (const raw of ['false', 'False', '0']) {
      const restore = overrideEnv({ MAIL_RESEND_TEST_MODE: raw })
      cleanup(restore)
      assert.isFalse(resolveDevTestMode(), raw)
      restore()
    }
  })

  test('valeur absente ou inconnue : mode test par défaut hors production', ({
    assert,
    cleanup,
  }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_MODE: undefined }))
    assert.isTrue(resolveDevTestMode())

    cleanup(overrideEnv({ MAIL_RESEND_TEST_MODE: 'peut-être' }))
    assert.isTrue(resolveDevTestMode())
  })
})

test.group('utils/mail/resend — resolveDevTestEvent', () => {
  test('« delivered » par défaut', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_EVENT: undefined }))
    assert.equal(resolveDevTestEvent(), 'delivered')
  })

  test('reconnaît chaque événement Resend, en ignorant casse et espaces', ({ assert, cleanup }) => {
    for (const event of ['delivered', 'bounced', 'complained', 'suppressed'] as const) {
      const restore = overrideEnv({ MAIL_RESEND_TEST_EVENT: ` ${event.toUpperCase()} ` })
      cleanup(restore)
      assert.equal(resolveDevTestEvent(), event)
      restore()
    }
  })

  test('valeur inconnue : repli sur « delivered »', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_EVENT: 'exploded' }))
    assert.equal(resolveDevTestEvent(), 'delivered')
  })
})

test.group('utils/mail/resend — resolveDevTestTo', (group) => {
  group.each.setup(() => overrideEnv(RESET_TEST_ENV))

  test('adresse explicite prioritaire, normalisée en minuscules', ({ assert, cleanup }) => {
    cleanup(
      overrideEnv({ MAIL_RESEND_TEST_TO: '  QA@Example.COM ', MAIL_RESEND_TEST_EVENT: 'bounced' })
    )
    assert.equal(resolveDevTestTo(message({ kind: 'onboarding' })), 'qa@example.com')
  })

  test('construit « <événement>+<kind>@resend.dev » depuis les métadonnées', ({
    assert,
    cleanup,
  }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_EVENT: 'bounced' }))
    assert.equal(resolveDevTestTo(message({ kind: 'Onboarding' })), 'bounced+onboarding@resend.dev')
  })

  test('libellé « mail » sans kind exploitable', ({ assert }) => {
    assert.equal(resolveDevTestTo(message()), 'delivered+mail@resend.dev')
    assert.equal(resolveDevTestTo(message({ kind: 42 })), 'delivered+mail@resend.dev')
    assert.equal(resolveDevTestTo(message({ kind: '   ' })), 'delivered+mail@resend.dev')
  })

  test('assainit le kind : caractères hors [a-z0-9-] retirés, 40 caractères max', ({ assert }) => {
    assert.equal(
      resolveDevTestTo(message({ kind: 'reset_password@2024!' })),
      'delivered+resetpassword2024@resend.dev'
    )
    assert.equal(resolveDevTestTo(message({ kind: '++é@' })), 'delivered+mail@resend.dev')

    const long = resolveDevTestTo(message({ kind: 'a'.repeat(60) }))
    assert.equal(long, `delivered+${'a'.repeat(40)}@resend.dev`)
  })

  test('« suppressed » vise l’adresse dédiée de Resend, sans suffixe', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_EVENT: 'suppressed' }))
    assert.equal(resolveDevTestTo(message({ kind: 'onboarding' })), 'suppressed@resend.dev')
  })

  test('ne réutilise jamais le vrai destinataire', ({ assert }) => {
    const to = resolveDevTestTo({ ...message(), to: { email: 'candidat@vrai-domaine.fr' } })
    assert.notInclude(to, 'vrai-domaine')
    assert.match(to, /@resend\.dev$/)
  })
})

test.group('utils/mail/resend — resolveDevTestFrom', () => {
  test('expéditeur de test Resend par défaut', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_FROM: undefined }))
    assert.equal(resolveDevTestFrom(), 'onboarding@resend.dev')
  })

  test('valeur explicite, normalisée', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_FROM: ' Dev@Example.com ' }))
    assert.equal(resolveDevTestFrom(), 'dev@example.com')
  })
})

test.group('utils/mail/resend — resolveResendApiKey', () => {
  test('renvoie la clé sans espaces autour', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ RESEND_API_KEY: '  re_test_123  ' }))
    assert.equal(resolveResendApiKey(), 're_test_123')
  })

  test('lève une erreur explicite si la clé est absente ou vide', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ RESEND_API_KEY: undefined }))
    assert.throws(
      () => resolveResendApiKey(),
      'RESEND_API_KEY is required when MAIL_PROVIDER=resend.'
    )

    cleanup(overrideEnv({ RESEND_API_KEY: '   ' }))
    assert.throws(() => resolveResendApiKey(), /RESEND_API_KEY is required/)
  })
})
