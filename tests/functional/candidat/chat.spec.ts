import { ChatConversationFactory } from '#database/factories/chat_conversation_factory'
import { ChatMessageFactory } from '#database/factories/chat_message_factory'
import ChatMessage from '#models/chat_message'
import { CHAT_AUTHOR_ROLES, CHAT_MESSAGE_MAX, CHAT_PATHS } from '#shared/constants/chat'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Chat candidat ↔ expert, côté candidat :
 * - `GET  /dashboard/candidat/chat`          → page (conversation, messages) ;
 * - `POST /dashboard/candidat/chat/messages` → envoi ;
 * - `POST /dashboard/candidat/chat/read`     → marque lu.
 */
const PAGE = 'dashboard/candidat/chat/Index'

test.group('Candidat — chat : page (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('B2C non payé, B2C payé et B2B accèdent au chat', async ({ client, assert }) => {
    for (const actor of [
      await createB2cCandidate(),
      await createB2cCandidate({ paid: true }),
      await createCandidate(),
    ]) {
      const response = await client.get(CHAT_PATHS.candidate).loginAs(actor.user).withInertia()
      const props = assertPage(assert, response, PAGE, ['conversation', 'messages', 'hasMore'])
      assert.deepEqual(props.messages, [])
      assert.isFalse(props.hasMore)
      assert.isNull((props.conversation as { expert: unknown }).expert)
    }
  })

  test('expose les messages, l’expert (nom seul) et le canal Transmit', async ({
    client,
    assert,
  }) => {
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ expert })
    const conversation = await ChatConversationFactory.merge({ employeeId: employee.id }).create()
    await ChatMessageFactory.merge({
      conversationId: conversation.id,
      authorUserId: user.id,
      body: 'Bonjour',
    }).create()

    const response = await client.get(CHAT_PATHS.candidate).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    const view = props.conversation as Record<string, unknown>
    assert.equal(view.channel, `chat/conversations/${conversation.id}`)
    assert.deepEqual(view.expert, { name: expert.name })
    const [message] = props.messages as Array<Record<string, unknown>>
    assert.deepEqual(Object.keys(message).sort(), ['authorRole', 'body', 'createdAt', 'id'])
    assert.notInclude(JSON.stringify(props), expert.email)
  })

  test('refuse un conseiller (403), renvoie l’invité vers la connexion', async ({ client }) => {
    const forbidden = await client
      .get(CHAT_PATHS.candidate)
      .loginAs(await createAdvisor())
      .redirects(0)
    forbidden.assertStatus(403)

    const guest = await client.get(CHAT_PATHS.candidate).redirects(0)
    guest.assertStatus(302)
    guest.assertHeader('location', '/auth/login')
  })

  test('un candidat non onboardé est renvoyé vers l’onboarding', async ({ client }) => {
    const { user } = await createB2cCandidate({ onboarded: false })
    const response = await client.get(CHAT_PATHS.candidate).loginAs(user).redirects(0)
    response.assertStatus(302)
  })
})

test.group('Candidat — chat : envoi (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre le message et revient à la page', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    const response = await client
      .post(CHAT_PATHS.candidateMessages)
      .loginAs(user)
      .header('Referer', CHAT_PATHS.candidate)
      .form({ body: '  Bonjour  ' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', CHAT_PATHS.candidate)
    const [message] = await ChatMessage.all()
    assert.equal(message.body, 'Bonjour')
    assert.equal(message.authorRole, CHAT_AUTHOR_ROLES.CANDIDATE)
    assert.equal(message.authorUserId, user.id)
  })

  test('valide le corps : vide ou trop long', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    for (const body of ['', '   ', 'a'.repeat(CHAT_MESSAGE_MAX + 1)]) {
      const response = await client
        .post(CHAT_PATHS.candidateMessages)
        .loginAs(user)
        .form({ body })
        .redirects(0)
      assertFieldErrors(assert, response, ['body'])
    }
    assert.lengthOf(await ChatMessage.all(), 0)
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const response = await client
      .post(CHAT_PATHS.candidateMessages)
      .loginAs(await createAdvisor())
      .form({ body: 'Salut' })
      .redirects(0)
    response.assertStatus(403)
  })

  test('30 messages par minute et par compte, le 31e est refusé (429)', async ({ client }) => {
    const { user } = await createB2cCandidate()
    for (let i = 0; i < 30; i++) {
      const ok = await client
        .post(CHAT_PATHS.candidateMessages)
        .loginAs(user)
        .form({ body: `m${i}` })
        .redirects(0)
      ok.assertStatus(302)
    }

    const limited = await client
      .post(CHAT_PATHS.candidateMessages)
      .loginAs(user)
      .header('Accept', 'application/json')
      .form({ body: 'trop' })
      .redirects(0)
    limited.assertStatus(429)
  })

  test('read marque la conversation lue', async ({ client, assert }) => {
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ expert })
    const conversation = await ChatConversationFactory.merge({ employeeId: employee.id }).create()
    await ChatMessageFactory.apply('fromExpert')
      .merge({ conversationId: conversation.id, authorUserId: expert.id })
      .create()

    const before = await client.get(CHAT_PATHS.candidate).loginAs(user).withInertia()
    assert.equal((assertPage(assert, before, PAGE).conversation as any).unreadCount, 1)

    const read = await client.post(CHAT_PATHS.candidateRead).loginAs(user).redirects(0)
    read.assertStatus(302)

    const after = await client.get(CHAT_PATHS.candidate).loginAs(user).withInertia()
    assert.equal((assertPage(assert, after, PAGE).conversation as any).unreadCount, 0)
  })
})
