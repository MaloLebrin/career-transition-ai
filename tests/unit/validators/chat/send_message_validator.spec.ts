import { CHAT_MESSAGE_MAX } from '#shared/constants/chat'
import { chatMessagesPageValidator } from '#validators/chat/messages_page_validator'
import { sendChatMessageValidator } from '#validators/chat/send_message_validator'
import { test } from '@japa/runner'

test.group('sendChatMessageValidator', () => {
  test('nettoie les espaces', async ({ assert }) => {
    assert.deepEqual(await sendChatMessageValidator.validate({ body: '  Bonjour  ' }), {
      body: 'Bonjour',
    })
  })

  test('rejette un message vide, blanc, absent ou trop long', async ({ assert }) => {
    await assert.rejects(() => sendChatMessageValidator.validate({ body: '' }))
    await assert.rejects(() => sendChatMessageValidator.validate({ body: '   ' }))
    await assert.rejects(() => sendChatMessageValidator.validate({}))
    await assert.rejects(() =>
      sendChatMessageValidator.validate({ body: 'a'.repeat(CHAT_MESSAGE_MAX + 1) })
    )
    await sendChatMessageValidator.validate({ body: 'a'.repeat(CHAT_MESSAGE_MAX) })
  })
})

test.group('chatMessagesPageValidator', () => {
  test('curseur optionnel, entier positif', async ({ assert }) => {
    assert.deepEqual(await chatMessagesPageValidator.validate({}), {})
    assert.deepEqual(await chatMessagesPageValidator.validate({ before: '12' }), { before: 12 })
    await assert.rejects(() => chatMessagesPageValidator.validate({ before: '0' }))
    await assert.rejects(() => chatMessagesPageValidator.validate({ before: 'x' }))
    await assert.rejects(() => chatMessagesPageValidator.validate({ before: '1.5' }))
  })
})
