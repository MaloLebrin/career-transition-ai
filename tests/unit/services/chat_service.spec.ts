import { ChatConversationFactory } from '#database/factories/chat_conversation_factory'
import { ChatMessageFactory } from '#database/factories/chat_message_factory'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import {
  ChatConversationNotFoundError,
  ChatForbiddenError,
  ChatMessageEmptyError,
} from '#exceptions/chat_errors'
import ChatConversation from '#models/chat_conversation'
import ChatMessage from '#models/chat_message'
import Notification from '#models/notification'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { ChatService } from '#services/chat_service'
import { NotificationService } from '#services/notification_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { PlatformTeamService } from '#services/platform_team_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import {
  CHAT_ASSIGNMENTS,
  CHAT_AUTHOR_ROLES,
  CHAT_PAGE_SIZE,
  chatChannel,
} from '#shared/constants/chat'
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '#shared/constants/notifications'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createPlatformOrganization,
  createUser,
} from '#tests/support/actors'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** Écrit la notification sans mettre l'e-mail en file (le job tourne en `sync` et ralentit chaque envoi). */
class RowOnlyNotificationService extends NotificationService {
  async notify(input: Parameters<NotificationService['notify']>[0]) {
    return Notification.create({
      userId: input.userId,
      type: input.type,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: input.title,
      body: input.body ?? null,
      meta: input.meta ?? null,
    })
  }
}

function makeService() {
  const platform = new PlatformOrganizationService()
  const team = new PlatformTeamService(
    platform,
    new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)
  )
  return new ChatService(
    team,
    platform,
    new CandidateNotificationsService(new RowOnlyNotificationService())
  )
}

test.group('ChatService — candidat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée la conversation à la première visite, une seule par candidat', async ({ assert }) => {
    const service = makeService()
    const { user, employee } = await createB2cCandidate()

    const first = await service.conversationForCandidate(user)
    const second = await service.conversationForCandidate(user)

    assert.equal(first.id, second.id)
    assert.equal(first.employeeId, employee.id)
    assert.isNotOk(first.assignedExpertUserId)
  })

  test('refuse un compte sans fiche candidat', async ({ assert }) => {
    const advisor = await createAdvisor()
    await assert.rejects(
      () => makeService().conversationForCandidate(advisor),
      CandidateProfileNotFoundError
    )
  })

  test('B2C non payé et B2B peuvent écrire : message persisté, conversation à jour', async ({
    assert,
  }) => {
    const service = makeService()
    for (const actor of [await createB2cCandidate(), await createCandidate()]) {
      const message = await service.sendAsCandidate(actor.user, { body: '  Bonjour  ' })
      const conversation = await service.conversationForCandidate(actor.user)

      assert.equal(message.body, 'Bonjour')
      assert.equal(message.authorRole, CHAT_AUTHOR_ROLES.CANDIDATE)
      assert.equal(message.authorUserId, actor.user.id)
      assert.isNotNull(conversation.lastMessageAt)
      assert.isNotNull(conversation.candidateLastReadAt)
    }
  })

  test('refuse un message vide une fois nettoyé', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    await assert.rejects(
      () => makeService().sendAsCandidate(user, { body: '   ' }),
      ChatMessageEmptyError
    )
  })

  test('page : derniers messages, curseur before, hasMore', async ({ assert }) => {
    const service = makeService()
    const { user } = await createB2cCandidate()
    const conversation = await service.conversationForCandidate(user)
    for (let i = 1; i <= CHAT_PAGE_SIZE + 5; i++) {
      await ChatMessageFactory.merge({
        conversationId: conversation.id,
        authorUserId: user.id,
        body: `m${i}`,
      }).create()
    }

    const page = await service.candidatePage(user)
    assert.lengthOf(page.messages, CHAT_PAGE_SIZE)
    assert.isTrue(page.hasMore)
    assert.equal(page.messages.at(-1)!.body, `m${CHAT_PAGE_SIZE + 5}`)
    assert.isBelow(page.messages[0].id, page.messages[1].id)
    assert.equal(page.conversation.channel, chatChannel(conversation.id))
    assert.isNull(page.conversation.expert)

    const older = await service.candidatePage(user, page.messages[0].id)
    assert.lengthOf(older.messages, 5)
    assert.isFalse(older.hasMore)
  })

  test('non lus : réponses de l’expert depuis la dernière lecture, remis à zéro par markRead', async ({
    assert,
  }) => {
    const service = makeService()
    const expert = await createInHouseExpert()
    const { user } = await createB2cCandidate({ expert })
    const conversation = await service.conversationForCandidate(user)
    await ChatMessageFactory.apply('fromExpert')
      .merge({ conversationId: conversation.id, authorUserId: expert.id })
      .create()

    const before = await service.candidatePage(user)
    assert.equal(before.conversation.unreadCount, 1)
    assert.equal(before.conversation.expert?.name, expert.name)

    await service.markReadAsCandidate(user)
    const after = await service.candidatePage(user)
    assert.equal(after.conversation.unreadCount, 0)
  })

  test('notifie l’expert responsable, une seule fois tant que non lu, sans nom de candidat', async ({
    assert,
  }) => {
    const service = makeService()
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ expert })

    await service.sendAsCandidate(user, { body: 'Un' })
    await service.sendAsCandidate(user, { body: 'Deux' })

    const notifications = await Notification.query().where('userId', expert.id)
    assert.lengthOf(notifications, 1)
    assert.equal(notifications[0].type, NOTIFICATION_TYPES.CHAT_MESSAGE_RECEIVED)
    assert.include(notifications[0].title, `#${employee.id}`)
    assert.notInclude(`${notifications[0].title} ${notifications[0].body}`, user.name ?? '§')

    notifications[0].status = NOTIFICATION_STATUSES.READ
    await notifications[0].save()
    await service.sendAsCandidate(user, { body: 'Trois' })
    assert.lengthOf(await Notification.query().where('userId', expert.id), 2)
  })

  test('sans expert : toute l’équipe de la plateforme est prévenue, pas les cabinets clients', async ({
    assert,
  }) => {
    const service = makeService()
    const expert = await createInHouseExpert()
    const other = await createInHouseExpert()
    const cabinetAdvisor = await createAdvisor()
    const { user } = await createB2cCandidate()

    await service.sendAsCandidate(user, { body: 'Bonjour' })

    const rows = await Notification.query().select('userId')
    const recipients = rows.map((n) => n.userId).sort()
    assert.deepEqual(recipients, [expert.id, other.id].sort())
    assert.notInclude(recipients, cabinetAdvisor.id)
  })
})

test.group('ChatService — équipe d’experts', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function conversationOf(
    candidate: Awaited<ReturnType<typeof createB2cCandidate>>,
    assignedExpertUserId: number | null = null
  ) {
    const conversation = await ChatConversationFactory.apply('active')
      .merge({ employeeId: candidate.employee.id, assignedExpertUserId })
      .create()
    await ChatMessageFactory.merge({
      conversationId: conversation.id,
      authorUserId: candidate.user.id,
      body: 'Bonjour, besoin d’aide',
    }).create()
    return conversation
  }

  test('file : sa conversation, celles de la file ; pas celle d’un autre expert ni les vides', async ({
    assert,
  }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const mine = await conversationOf(await createB2cCandidate({ expert: me }))
    const queued = await conversationOf(await createB2cCandidate())
    const theirs = await conversationOf(await createB2cCandidate({ expert: other }))
    const claimed = await conversationOf(await createB2cCandidate(), other.id)
    const empty = await createB2cCandidate()
    await ChatConversationFactory.merge({ employeeId: empty.employee.id }).create()

    const list = await service.listForExpert(me)

    assert.sameMembers(
      list.map((c) => c.id),
      [mine.id, queued.id]
    )
    assert.equal(list[0].id, queued.id, 'la file passe avant')
    assert.equal(list[0].assignment, CHAT_ASSIGNMENTS.QUEUE)
    assert.equal(list.find((c) => c.id === mine.id)!.assignment, CHAT_ASSIGNMENTS.ME)
    assert.notInclude(
      list.map((c) => c.id),
      theirs.id
    )
    assert.notInclude(
      list.map((c) => c.id),
      claimed.id
    )
    assert.match(list[0].candidateLabel, /^Candidat #\d+$/)
    assert.equal(list[0].lastMessagePreview, 'Bonjour, besoin d’aide')
    assert.equal(list[0].unreadCount, 1)
  })

  test('l’admin de la plateforme voit toutes les conversations', async ({ assert }) => {
    const service = makeService()
    const platform = await createPlatformOrganization()
    const admin = await createAdmin(platform)
    const other = await createInHouseExpert()
    await conversationOf(await createB2cCandidate({ expert: other }))
    await conversationOf(await createB2cCandidate())

    const list = await service.listForExpert(admin)
    assert.lengthOf(list, 2)
    assert.includeMembers(
      list.map((c) => c.assignment),
      [CHAT_ASSIGNMENTS.OTHER]
    )
  })

  test('un candidat B2B (conseiller de cabinet) est dans la file de la plateforme', async ({
    assert,
  }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const cabinetAdvisor = await createAdvisor()
    const b2b = await createCandidate({ advisor: cabinetAdvisor })
    const conversation = await ChatConversationFactory.apply('active')
      .merge({ employeeId: b2b.employee.id })
      .create()

    const list = await service.listForExpert(me)
    assert.equal(list.find((c) => c.id === conversation.id)?.assignment, CHAT_ASSIGNMENTS.QUEUE)
  })

  test('403 hors équipe de la plateforme, 404 sur la conversation d’un autre expert', async ({
    assert,
  }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const theirs = await conversationOf(await createB2cCandidate({ expert: other }))
    const cabinetAdvisor = await createAdvisor()
    const queued = await conversationOf(await createB2cCandidate())

    await assert.rejects(() => service.listForExpert(cabinetAdvisor), ChatForbiddenError)
    await assert.rejects(() => service.expertPage(cabinetAdvisor, queued.id), ChatForbiddenError)
    await assert.rejects(() => service.expertPage(me, theirs.id), ChatConversationNotFoundError)
    await assert.rejects(
      () => service.sendAsExpert(me, theirs.id, { body: 'x' }),
      ChatConversationNotFoundError
    )
    await assert.rejects(() => service.claim(me, theirs.id), ChatConversationNotFoundError)
    await assert.rejects(
      () => service.markReadAsExpert(me, theirs.id),
      ChatConversationNotFoundError
    )
    await assert.rejects(() => service.expertPage(me, 999999), ChatConversationNotFoundError)
  })

  test('claim : pose l’expert, idempotent pour lui, 404 pour un autre ensuite', async ({
    assert,
  }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const queued = await conversationOf(await createB2cCandidate())

    const claimed = await service.claim(me, queued.id)
    assert.equal(claimed.assignedExpertUserId, me.id)
    await service.claim(me, queued.id)
    await assert.rejects(() => service.claim(other, queued.id), ChatConversationNotFoundError)
    assert.lengthOf(await service.listForExpert(other), 0)
  })

  test('répondre depuis la file prend la conversation et notifie le candidat', async ({
    assert,
  }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const candidate = await createB2cCandidate()
    const queued = await conversationOf(candidate)

    const message = await service.sendAsExpert(me, queued.id, { body: ' Bonjour ! ' })

    assert.equal(message.authorRole, CHAT_AUTHOR_ROLES.EXPERT)
    assert.equal(message.body, 'Bonjour !')
    await queued.refresh()
    assert.equal(queued.assignedExpertUserId, me.id)
    const [notification] = await Notification.query().where('userId', candidate.user.id)
    assert.equal(notification.type, NOTIFICATION_TYPES.CHAT_MESSAGE_RECEIVED)
  })

  test('l’expert assigné par la fiche prime sur la prise en charge', async ({ assert }) => {
    const service = makeService()
    const taker = await createInHouseExpert()
    const assigned = await createInHouseExpert()
    const candidate = await createB2cCandidate({ expert: assigned })
    await conversationOf(candidate, taker.id)

    assert.lengthOf(await service.listForExpert(taker), 0)
    assert.lengthOf(await service.listForExpert(assigned), 1)
  })

  test('markReadAsExpert remet les non lus à zéro', async ({ assert }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const queued = await conversationOf(await createB2cCandidate())

    const before = await service.expertPage(me, queued.id)
    assert.equal(before.conversation.unreadCount, 1)
    await service.markReadAsExpert(me, queued.id)
    const after = await service.expertPage(me, queued.id)
    assert.equal(after.conversation.unreadCount, 0)
    const stored = await ChatConversation.findOrFail(queued.id)
    assert.isNotNull(stored.expertLastReadAt)
  })

  test('une fiche supprimée disparaît de la file', async ({ assert }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const candidate = await createB2cCandidate()
    await conversationOf(candidate)
    candidate.employee.deletedAt = DateTime.now()
    await candidate.employee.save()

    assert.lengthOf(await service.listForExpert(me), 0)
  })

  test('canSubscribe suit les règles d’accès du canal', async ({ assert }) => {
    const service = makeService()
    const me = await createInHouseExpert()
    const other = await createInHouseExpert()
    const cabinetAdvisor = await createAdvisor()
    const platform = await createPlatformOrganization()
    const superAdmin = await createUser(USERS_ROLES.SUPER_ADMIN, platform)
    const candidate = await createB2cCandidate({ expert: me })
    const stranger = await createB2cCandidate()
    const conversation = await conversationOf(candidate)

    assert.isTrue(await service.canSubscribe(candidate.user, conversation.id))
    assert.isTrue(await service.canSubscribe(me, conversation.id))
    assert.isTrue(await service.canSubscribe(superAdmin, conversation.id))
    assert.isFalse(await service.canSubscribe(other, conversation.id))
    assert.isFalse(await service.canSubscribe(stranger.user, conversation.id))
    assert.isFalse(await service.canSubscribe(cabinetAdvisor, conversation.id))
    assert.isFalse(await service.canSubscribe(null, conversation.id))
    assert.isFalse(await service.canSubscribe(me, 999999))
    assert.isFalse(await service.canSubscribe(me, Number.NaN))
  })

  test('messages purgés avec la fiche candidat (CASCADE)', async ({ assert }) => {
    const candidate = await createB2cCandidate()
    const conversation = await conversationOf(candidate)
    await candidate.employee.delete()

    assert.isNull(await ChatConversation.find(conversation.id))
    assert.lengthOf(await ChatMessage.query().where('conversationId', conversation.id), 0)
  })
})
