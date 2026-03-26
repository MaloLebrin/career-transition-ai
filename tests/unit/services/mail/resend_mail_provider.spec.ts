import { test } from '@japa/runner'
import { ResendMailProvider } from '#integrations/mail/providers/resend_mail_provider'

test.group('ResendMailProvider', () => {
  test('maps MailMessage to Resend payload', async ({ assert }) => {
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
    assert.equal(sent[0].from, 'From <from@example.com>')
    assert.deepEqual(sent[0].to, ['To <to@example.com>'])
    assert.equal(sent[0].subject, 'Hello')
    assert.equal(sent[0].text, 'Body')
    assert.deepEqual(sent[0].tags, [
      { name: 'tag', value: 'onboarding' },
      { name: 'tag', value: 'test' },
    ])
    assert.equal(sent[0].headers['X-Mail-Metadata'], JSON.stringify({ kind: 'onboarding', userId: 123 }))
  })

  test('throws when missing both text and html', async ({ assert }) => {
    const provider = new ResendMailProvider({
      emails: {
        send: async () => ({ data: { id: '1' } }),
      },
    } as any)

    await assert.rejects(
      async () => {
        await provider.send({
          from: { email: 'from@example.com' },
          to: { email: 'to@example.com' },
          subject: 'Hello',
        })
      },
      /at least one of: text, html/
    )
  })
})

