import { ResendMailProvider } from '#services/mail/providers/resend_mail_provider'
import { overrideEnv } from '#tests/utils/env'
import { test } from '@japa/runner'

test.group('ResendMailProvider', () => {
  test('maps MailMessage to Resend payload', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_RESEND_TEST_MODE: 'false' }))

    const sent: any[] = []
    const provider = new ResendMailProvider({
      emails: {
        send: async (payload: any) => {
          sent.push(payload)
          return { data: { id: '1' } }
        },
      },
    } as any)

    await provider.send({
      from: { email: 'from@example.com', name: 'From' },
      to: { email: 'to@example.com', name: 'To' },
      subject: 'Hello',
      text: 'Body',
      tags: ['onboarding', 'test'],
      metadata: { kind: 'onboarding', userId: 123 },
    })

    assert.equal(sent.length, 1)
    assert.equal(sent[0].from, 'Contact <contact@careertransition.fr>')
    assert.deepEqual(sent[0].to, ['To <to@example.com>'])
    assert.equal(sent[0].subject, 'Hello')
    assert.equal(sent[0].text, 'Body')
    assert.deepEqual(sent[0].tags, [
      { name: 'tag', value: 'onboarding' },
      { name: 'tag', value: 'test' },
    ])
    assert.equal(
      sent[0].headers['X-Mail-Metadata'],
      JSON.stringify({ kind: 'onboarding', userId: 123 })
    )
  })

  test('routes to Resend test recipient in dev mode', async ({ assert, cleanup }) => {
    cleanup(
      overrideEnv({
        MAIL_RESEND_TEST_MODE: 'true',
        MAIL_RESEND_TEST_EVENT: 'bounced',
        MAIL_RESEND_TEST_TO: undefined,
      })
    )

    const sent: any[] = []
    const provider = new ResendMailProvider({
      emails: {
        send: async (payload: any) => {
          sent.push(payload)
          return { data: { id: '1' } }
        },
      },
    } as any)

    await provider.send({
      from: { email: 'from@example.com', name: 'From' },
      to: { email: 'real-user@example.com', name: 'Real User' },
      subject: 'Hello',
      text: 'Body',
      metadata: { kind: 'onboarding' },
    })

    assert.equal(sent.length, 1)
    assert.equal(sent[0].from, 'onboarding@resend.dev')
    assert.deepEqual(sent[0].to, ['bounced+onboarding@resend.dev'])
  })

  test('uses explicit test recipient when configured', async ({ assert, cleanup }) => {
    cleanup(
      overrideEnv({
        MAIL_RESEND_TEST_MODE: 'true',
        MAIL_RESEND_TEST_TO: 'delivered+manual@resend.dev',
      })
    )

    const sent: any[] = []
    const provider = new ResendMailProvider({
      emails: {
        send: async (payload: any) => {
          sent.push(payload)
          return { data: { id: '1' } }
        },
      },
    } as any)

    await provider.send({
      from: { email: 'from@example.com' },
      to: { email: 'real-user@example.com' },
      subject: 'Hello',
      text: 'Body',
    })

    assert.equal(sent.length, 1)
    assert.deepEqual(sent[0].to, ['delivered+manual@resend.dev'])
  })

  test('throws when missing both text and html', async ({ assert }) => {
    const provider = new ResendMailProvider({
      emails: {
        send: async () => ({ data: { id: '1' } }),
      },
    } as any)

    await assert.rejects(async () => {
      await provider.send({
        from: { email: 'from@example.com' },
        to: { email: 'to@example.com' },
        subject: 'Hello',
      })
    }, /at least one of: text, html/)
  })
})
