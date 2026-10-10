import { ChatConversationFactory } from '#database/factories/chat_conversation_factory'
import { ChatMessageFactory } from '#database/factories/chat_message_factory'
import ChatConversation from '#models/chat_conversation'
import ChatMessage from '#models/chat_message'
import { CHAT_ASSIGNMENTS, CHAT_AUTHOR_ROLES, CHAT_PATHS } from '#shared/constants/chat'
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
 * Chat candidat ↔ expert, côté équipe d'experts de la plateforme :
 * file, conversation, envoi, prise en charge, lecture ; isolation (404) entre experts.
 */
const INDEX = 'dashboard/conseiller/chat/Index'
const SHOW = 'dashboard/conseiller/chat/Show'

async function openConversation(
  candidate: Awaited<ReturnType<typeof createB2cCandidate>>,
  assignedExpertUserId: number | null = null
) {
  const conversation = await ChatConversationFactory.apply('active')
    .merge({ employeeId: candidate.employee.id, assignedExpertUserId })
    .create()
  await ChatMessageFactory.merge({
    conversationId: conversation.id,
    authorUserId: candidate.user.id,
    body: 'Besoin d’aide',
  }).create()
  return conversation
}

test.group('Conseiller — chat : file et conversation (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('index : la file de l’expert, sans nom de candidat', async ({ client, assert }) => {
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const candidate = await createB2cCandidate()
    const queued = await openConversation(candidate)
    await openConversation(await createB2cCandidate({ expert: other }))

    const response = await client.get(CHAT_PATHS.expert).loginAs(me).withInertia()

    const props = assertPage(assert, response, INDEX, ['conversations'])
    const conversations = props.conversations as Array<Record<string, unknown>>
    assert.lengthOf(conversations, 1)
    assert.equal(conversations[0].id, queued.id)
    assert.equal(conversations[0].assignment, CHAT_ASSIGNMENTS.QUEUE)
    assert.equal(conversations[0].candidateLabel, `Candidat #${candidate.employee.id}`)
    assert.notInclude(JSON.stringify(props), candidate.employee.name)
    assert.notInclude(JSON.stringify(props), candidate.user.email)
  })

  test('show : conversation et messages', async ({ client, assert }) => {
    const me = await createInHouseExpert()
    const conversation = await openConversation(await createB2cCandidate({ expert: me }))

    const response = await client
      .get(CHAT_PATHS.expertShow(conversation.id))
      .loginAs(me)
      .withInertia()

    const props = assertPage(assert, response, SHOW, ['conversation', 'messages', 'hasMore'])
    assert.equal((props.conversation as any).assignment, CHAT_ASSIGNMENTS.ME)
    assert.lengthOf(props.messages as unknown[], 1)
  })

  test('404 sur la conversation d’un autre expert ou inconnue', async ({ client }) => {
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const theirs = await openConversation(await createB2cCandidate({ expert: other }))

    const foreign = await client.get(CHAT_PATHS.expertShow(theirs.id)).loginAs(me).redirects(0)
    foreign.assertStatus(404)
    const unknown = await client.get(CHAT_PATHS.expertShow(999999)).loginAs(me).redirects(0)
    unknown.assertStatus(404)
  })

  test('un conseiller d’un cabinet client : 403 ; un candidat : 403 ; invité : connexion', async ({
    client,
  }) => {
    const cabinetAdvisor = await createAdvisor()
    const conversation = await openConversation(await createB2cCandidate())

    const list = await client.get(CHAT_PATHS.expert).loginAs(cabinetAdvisor).redirects(0)
    list.assertStatus(403)
    const show = await client
      .get(CHAT_PATHS.expertShow(conversation.id))
      .loginAs(cabinetAdvisor)
      .redirects(0)
    show.assertStatus(403)
    const candidate = await createCandidate()
    const asCandidate = await client.get(CHAT_PATHS.expert).loginAs(candidate.user).redirects(0)
    asCandidate.assertStatus(403)
    const guest = await client.get(CHAT_PATHS.expert).redirects(0)
    guest.assertStatus(302)
    guest.assertHeader('location', '/auth/login')
  })
})

test.group('Conseiller — chat : actions (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('répondre depuis la file prend la conversation', async ({ client, assert }) => {
    const me = await createInHouseExpert()
    const conversation = await openConversation(await createB2cCandidate())
    const path = CHAT_PATHS.expertMessages(conversation.id)

    const response = await client
      .post(path)
      .loginAs(me)
      .header('Referer', CHAT_PATHS.expertShow(conversation.id))
      .form({ body: 'Bonjour' })
      .redirects(0)

    response.assertStatus(302)
    const messages = await ChatMessage.query().where('authorRole', CHAT_AUTHOR_ROLES.EXPERT)
    assert.lengthOf(messages, 1)
    assert.equal(messages[0].authorUserId, me.id)
    const stored = await ChatConversation.findOrFail(conversation.id)
    assert.equal(stored.assignedExpertUserId, me.id)
  })

  test('validation du corps et isolation : 404 sur la conversation d’un autre expert', async ({
    client,
    assert,
  }) => {
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const mine = await openConversation(await createB2cCandidate({ expert: me }))
    const theirs = await openConversation(await createB2cCandidate({ expert: other }))

    const invalid = await client
      .post(CHAT_PATHS.expertMessages(mine.id))
      .loginAs(me)
      .form({ body: '  ' })
      .redirects(0)
    assertFieldErrors(assert, invalid, ['body'])

    for (const path of [
      CHAT_PATHS.expertMessages(theirs.id),
      CHAT_PATHS.expertClaim(theirs.id),
      CHAT_PATHS.expertRead(theirs.id),
    ]) {
      const response = await client.post(path).loginAs(me).form({ body: 'intrus' }).redirects(0)
      response.assertStatus(404)
    }
    assert.lengthOf(await ChatMessage.query().where('authorRole', CHAT_AUTHOR_ROLES.EXPERT), 0)
  })

  test('claim : prend la conversation, puis 404 pour un autre expert', async ({
    client,
    assert,
  }) => {
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const conversation = await openConversation(await createB2cCandidate())

    const claimed = await client
      .post(CHAT_PATHS.expertClaim(conversation.id))
      .loginAs(me)
      .redirects(0)
    claimed.assertStatus(302)
    claimed.assertFlashMessage('success', 'Conversation prise en charge.')
    const stored = await ChatConversation.findOrFail(conversation.id)
    assert.equal(stored.assignedExpertUserId, me.id)

    const late = await client
      .post(CHAT_PATHS.expertClaim(conversation.id))
      .loginAs(other)
      .redirects(0)
    late.assertStatus(404)
  })

  test('read remet les non lus à zéro', async ({ client, assert }) => {
    const me = await createInHouseExpert()
    const conversation = await openConversation(await createB2cCandidate())

    const read = await client.post(CHAT_PATHS.expertRead(conversation.id)).loginAs(me).redirects(0)
    read.assertStatus(302)

    const page = await client.get(CHAT_PATHS.expertShow(conversation.id)).loginAs(me).withInertia()
    assert.equal((assertPage(assert, page, SHOW).conversation as any).unreadCount, 0)
  })

  test('un conseiller d’un cabinet client ne peut ni écrire ni prendre (403)', async ({
    client,
  }) => {
    const cabinetAdvisor = await createAdvisor()
    const conversation = await openConversation(await createB2cCandidate())

    for (const path of [
      CHAT_PATHS.expertMessages(conversation.id),
      CHAT_PATHS.expertClaim(conversation.id),
    ]) {
      const response = await client
        .post(path)
        .loginAs(cabinetAdvisor)
        .form({ body: 'x' })
        .redirects(0)
      response.assertStatus(403)
    }
  })
})
