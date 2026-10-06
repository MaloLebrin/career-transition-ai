import ChatMessage from '#models/chat_message'
import ChatMessageTransformer, { chatMessageView } from '#transformers/chat_message_transformer'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ChatMessageTransformer', () => {
  test('ne rend que id, authorRole, body et createdAt', ({ assert }) => {
    const message = new ChatMessage()
    message.id = 4
    message.authorRole = 'expert'
    message.body = 'Bonjour'
    message.authorUserId = 9
    message.conversationId = 2
    message.createdAt = DateTime.fromISO('2026-10-05T10:00:00.000Z')

    const view = new ChatMessageTransformer(message).toObject()

    assert.deepEqual(view, chatMessageView(message))
    assert.deepEqual(Object.keys(view).sort(), ['authorRole', 'body', 'createdAt', 'id'])
    assert.equal(view.createdAt, message.createdAt.toISO())
  })
})
