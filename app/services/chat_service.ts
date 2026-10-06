import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import {
  ChatConversationNotFoundError,
  ChatForbiddenError,
  ChatMessageEmptyError,
} from '#exceptions/chat_errors'
import ChatConversation from '#models/chat_conversation'
import ChatMessage from '#models/chat_message'
import Employee from '#models/employee'
import User from '#models/user'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { PlatformTeamService } from '#services/platform_team_service'
import {
  CHAT_ASSIGNMENTS,
  CHAT_AUTHOR_ROLES,
  CHAT_PAGE_SIZE,
  CHAT_PREVIEW_MAX,
  chatChannel,
  type ChatAssignment,
  type ChatAuthorRole,
} from '#shared/constants/chat'
import { PLATFORM_TEAM_ROLES } from '#shared/constants/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { SendChatMessageInput } from '#shared/types/chat/inputs'
import type {
  CandidateChatPageProps,
  ChatConversationSummary,
  ChatMessagesPage,
  ExpertChatShowPageProps,
} from '#shared/types/chat/views'
import { chatMessageView } from '#transformers/chat_message_transformer'
import { canSubscribeToChatConversation } from '#utils/transmit_authorization'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'

/**
 * Expert responsable d'une conversation : l'expert de la fiche
 * (`employees.advisor_id`) quand il fait partie de la plateforme (il prime), sinon
 * celui qui a pris la conversation. `null` : elle est dans la file de l'équipe.
 * Le conseiller d'un cabinet client n'est jamais l'interlocuteur du chat.
 */
const EFFECTIVE_EXPERT_SQL = `COALESCE(
  CASE WHEN advisor.organization_id = ? AND advisor.deleted_at IS NULL THEN employees.advisor_id END,
  chat_conversations.assigned_expert_user_id
)`

type ConversationRow = {
  conversation: ChatConversation
  employee: Employee
  effectiveExpertId: number | null
}

/**
 * Chat candidat ↔ expert : une conversation par candidat avec l'équipe
 * d'experts de la plateforme, sans condition de paiement.
 *
 * Côté équipe, seuls les membres de l'organisation plateforme (`advisor`,
 * `expert`, `admin`) y accèdent (403 sinon) ; un expert voit sa file (ses
 * conversations et celles sans expert), l'admin tout. Une conversation d'un
 * autre expert → 404. Messages diffusés sur Transmit depuis le process web ;
 * l'autre partie est notifiée (id du candidat seulement, jamais son nom).
 */
@inject()
export class ChatService {
  constructor(
    private team: PlatformTeamService,
    private platformOrganization: PlatformOrganizationService,
    private notifications: CandidateNotificationsService
  ) {}

  // ----- Candidat -----

  /** Conversation du candidat, créée à la première visite. */
  public async conversationForCandidate(user: User): Promise<ChatConversation> {
    const employee = await this.ownEmployee(user)
    return ChatConversation.firstOrCreate({ employeeId: employee.id }, { employeeId: employee.id })
  }

  public async candidatePage(
    user: User,
    before: number | null = null
  ): Promise<CandidateChatPageProps> {
    const base = await this.conversationForCandidate(user)
    const row = await this.rowOrFail(base.id)
    const expert = row.effectiveExpertId
      ? await User.query().where('id', row.effectiveExpertId).select('id', 'name').first()
      : null
    const unread = await this.unreadCounts([base.id], CHAT_AUTHOR_ROLES.CANDIDATE)

    return {
      conversation: {
        id: base.id,
        channel: chatChannel(base.id),
        expert: expert ? { name: expert.name ?? 'Votre expert' } : null,
        lastMessageAt: base.lastMessageAt?.toISO() ?? null,
        unreadCount: unread.get(base.id) ?? 0,
      },
      ...(await this.messagesPage(base.id, before)),
    }
  }

  public async sendAsCandidate(user: User, input: SendChatMessageInput): Promise<ChatMessage> {
    const base = await this.conversationForCandidate(user)
    const row = await this.rowOrFail(base.id)
    const message = await this.persist(
      row.conversation,
      user.id,
      CHAT_AUTHOR_ROLES.CANDIDATE,
      input
    )

    const recipients = row.effectiveExpertId
      ? [row.effectiveExpertId]
      : await this.platformMemberIds()
    for (const recipientUserId of recipients) {
      await this.notifications.chatMessageReceived({
        recipientUserId,
        conversationId: row.conversation.id,
        employeeId: row.employee.id,
        audience: 'team',
      })
    }
    return message
  }

  public async markReadAsCandidate(user: User): Promise<void> {
    const conversation = await this.conversationForCandidate(user)
    conversation.candidateLastReadAt = DateTime.now()
    await conversation.save()
  }

  // ----- Équipe d'experts -----

  /** File de l'expert : à prendre et non lues d'abord, puis les plus récentes. */
  public async listForExpert(expert: User): Promise<ChatConversationSummary[]> {
    const platformId = await this.assertTeamMember(expert)
    const query = this.baseQuery(platformId).whereNotNull('chat_conversations.last_message_at')
    this.restrictToVisible(query, expert, platformId)
    const rows = this.toRows(await query)
    if (rows.length === 0) return []

    const ids = rows.map((row) => row.conversation.id)
    const unread = await this.unreadCounts(ids, CHAT_AUTHOR_ROLES.EXPERT)
    const previews = await this.lastMessageBodies(ids)

    return rows
      .map((row) => this.toSummary(row, expert, unread, previews))
      .sort((a, b) => {
        const rank = (s: ChatConversationSummary) =>
          s.assignment === CHAT_ASSIGNMENTS.QUEUE ? 0 : s.unreadCount > 0 ? 1 : 2
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
        return (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')
      })
  }

  public async expertPage(
    expert: User,
    conversationId: number,
    before: number | null = null
  ): Promise<ExpertChatShowPageProps> {
    const row = await this.accessibleRow(expert, conversationId)
    const unread = await this.unreadCounts([conversationId], CHAT_AUTHOR_ROLES.EXPERT)
    const previews = await this.lastMessageBodies([conversationId])
    return {
      conversation: this.toSummary(row, expert, unread, previews),
      ...(await this.messagesPage(conversationId, before)),
    }
  }

  /** Répondre prend la conversation si elle était dans la file. */
  public async sendAsExpert(
    expert: User,
    conversationId: number,
    input: SendChatMessageInput
  ): Promise<ChatMessage> {
    const row = await this.accessibleRow(expert, conversationId)
    if (row.effectiveExpertId === null) {
      row.conversation.assignedExpertUserId = expert.id
    }
    const message = await this.persist(row.conversation, expert.id, CHAT_AUTHOR_ROLES.EXPERT, input)

    if (row.employee.userId) {
      await this.notifications.chatMessageReceived({
        recipientUserId: row.employee.userId,
        conversationId,
        employeeId: row.employee.id,
        audience: 'candidate',
      })
    }
    return message
  }

  /** Prend une conversation de la file ; idempotent pour son propre expert, 404 si déjà prise par un autre. */
  public async claim(expert: User, conversationId: number): Promise<ChatConversation> {
    const row = await this.accessibleRow(expert, conversationId)
    if (row.effectiveExpertId === expert.id) return row.conversation
    if (row.effectiveExpertId !== null) throw new ChatConversationNotFoundError()

    // Mise à jour conditionnelle : deux experts qui prennent ensemble, un seul l'emporte.
    const claimed = await ChatConversation.query()
      .where('id', conversationId)
      .whereNull('assignedExpertUserId')
      .update({ assignedExpertUserId: expert.id })
    const affected = Array.isArray(claimed) ? Number(claimed[0]) : Number(claimed)
    if (affected === 0) throw new ChatConversationNotFoundError()

    await row.conversation.refresh()
    return row.conversation
  }

  public async markReadAsExpert(expert: User, conversationId: number): Promise<void> {
    const row = await this.accessibleRow(expert, conversationId)
    row.conversation.expertLastReadAt = DateTime.now()
    await row.conversation.save()
  }

  // ----- Transmit -----

  /** Droit de souscrire au canal d'une conversation (cf. `canSubscribeToChatConversation`). */
  public async canSubscribe(
    user: Pick<User, 'id' | 'role' | 'organizationId'> | null | undefined,
    conversationId: number
  ): Promise<boolean> {
    if (!user || !Number.isInteger(conversationId)) return false
    const platformId = await this.platformOrganization.getId()
    const [row] = this.toRows(
      await this.baseQuery(platformId).where('chat_conversations.id', conversationId)
    )
    if (!row) return false
    return canSubscribeToChatConversation(user, {
      candidateUserId: row.employee.userId,
      effectiveExpertId: row.effectiveExpertId,
      isPlatformMember:
        user.organizationId === platformId &&
        (PLATFORM_TEAM_ROLES as readonly string[]).includes(user.role),
    })
  }

  // ----- Interne -----

  private async persist(
    conversation: ChatConversation,
    authorUserId: number,
    authorRole: ChatAuthorRole,
    input: SendChatMessageInput
  ): Promise<ChatMessage> {
    const body = input.body.trim()
    if (!body) throw new ChatMessageEmptyError()

    const message = await ChatMessage.create({
      conversationId: conversation.id,
      authorUserId,
      authorRole,
      body,
    })
    conversation.lastMessageAt = message.createdAt
    if (authorRole === CHAT_AUTHOR_ROLES.CANDIDATE) {
      conversation.candidateLastReadAt = message.createdAt
    } else {
      conversation.expertLastReadAt = message.createdAt
    }
    await conversation.save()

    transmit.broadcast(chatChannel(conversation.id), { ...chatMessageView(message) })
    return message
  }

  /** Les `CHAT_PAGE_SIZE` derniers messages, ou ceux qui précèdent `before`, du plus ancien au plus récent. */
  private async messagesPage(
    conversationId: number,
    before: number | null
  ): Promise<ChatMessagesPage> {
    const query = ChatMessage.query()
      .where('conversationId', conversationId)
      .orderBy('id', 'desc')
      .limit(CHAT_PAGE_SIZE + 1)
    if (before !== null) query.where('id', '<', before)
    const rows = await query
    const hasMore = rows.length > CHAT_PAGE_SIZE
    return {
      messages: rows.slice(0, CHAT_PAGE_SIZE).reverse().map(chatMessageView),
      hasMore,
    }
  }

  /** Messages de l'autre partie que `reader` n'a pas lus, par conversation. */
  private async unreadCounts(
    conversationIds: number[],
    reader: ChatAuthorRole
  ): Promise<Map<number, number>> {
    const candidateReads = reader === CHAT_AUTHOR_ROLES.CANDIDATE
    const readAtColumn = candidateReads ? 'c.candidate_last_read_at' : 'c.expert_last_read_at'
    const rows = await db
      .from('chat_messages as m')
      .join('chat_conversations as c', 'c.id', 'm.conversation_id')
      .whereIn('c.id', conversationIds)
      .where(
        'm.author_role',
        candidateReads ? CHAT_AUTHOR_ROLES.EXPERT : CHAT_AUTHOR_ROLES.CANDIDATE
      )
      .where((q) => q.whereNull(readAtColumn).orWhereRaw(`m.created_at > ${readAtColumn}`))
      .groupBy('c.id')
      .select('c.id')
      .count('* as total')
    return new Map(rows.map((row) => [Number(row.id), Number(row.total)]))
  }

  private async lastMessageBodies(conversationIds: number[]): Promise<Map<number, string>> {
    const rows = await ChatMessage.query().whereIn(
      'id',
      db
        .from('chat_messages')
        .whereIn('conversation_id', conversationIds)
        .groupBy('conversation_id')
        .select(db.raw('max(id)'))
    )
    return new Map(rows.map((row) => [row.conversationId, row.body]))
  }

  private toSummary(
    row: ConversationRow,
    expert: User,
    unread: Map<number, number>,
    previews: Map<number, string>
  ): ChatConversationSummary {
    const preview = previews.get(row.conversation.id)
    let assignment: ChatAssignment = CHAT_ASSIGNMENTS.OTHER
    if (row.effectiveExpertId === null) assignment = CHAT_ASSIGNMENTS.QUEUE
    else if (row.effectiveExpertId === expert.id) assignment = CHAT_ASSIGNMENTS.ME

    return {
      id: row.conversation.id,
      channel: chatChannel(row.conversation.id),
      employeeId: row.employee.id,
      candidateLabel: `Candidat #${row.employee.id}`,
      accountType: row.employee.accountType,
      assignment,
      lastMessageAt: row.conversation.lastMessageAt?.toISO() ?? null,
      lastMessagePreview: preview
        ? preview.length > CHAT_PREVIEW_MAX
          ? `${preview.slice(0, CHAT_PREVIEW_MAX)}…`
          : preview
        : null,
      unreadCount: unread.get(row.conversation.id) ?? 0,
    }
  }

  /** Conversations des fiches non supprimées, avec l'expert responsable calculé en SQL. */
  private baseQuery(platformId: number) {
    return ChatConversation.query()
      .join('employees', 'employees.id', 'chat_conversations.employee_id')
      .leftJoin('users as advisor', 'advisor.id', 'employees.advisor_id')
      .whereNull('employees.deleted_at')
      .select('chat_conversations.*')
      .select(db.raw(`${EFFECTIVE_EXPERT_SQL} as effective_expert_id`, [platformId]))
      .preload('employee')
  }

  /** L'admin voit toutes les conversations ; advisor et expert, les leurs et celles de la file. */
  private restrictToVisible(
    query: ReturnType<ChatService['baseQuery']>,
    expert: User,
    platformId: number
  ) {
    if (expert.role === USERS_ROLES.ADMIN) return
    query.whereRaw(`(${EFFECTIVE_EXPERT_SQL} = ? OR ${EFFECTIVE_EXPERT_SQL} IS NULL)`, [
      platformId,
      expert.id,
      platformId,
    ])
  }

  private toRows(conversations: ChatConversation[]): ConversationRow[] {
    return conversations.map((conversation) => {
      const effective = conversation.$extras.effective_expert_id
      return {
        conversation,
        employee: conversation.employee,
        effectiveExpertId: effective === null || effective === undefined ? null : Number(effective),
      }
    })
  }

  private async rowOrFail(conversationId: number): Promise<ConversationRow> {
    const platformId = await this.platformOrganization.getId()
    const [row] = this.toRows(
      await this.baseQuery(platformId).where('chat_conversations.id', conversationId)
    )
    if (!row) throw new ChatConversationNotFoundError()
    return row
  }

  /** Conversation visible de l'expert (403 hors équipe, 404 si d'un autre expert). */
  private async accessibleRow(expert: User, conversationId: number): Promise<ConversationRow> {
    const platformId = await this.assertTeamMember(expert)
    const query = this.baseQuery(platformId).where('chat_conversations.id', conversationId)
    this.restrictToVisible(query, expert, platformId)
    const [row] = this.toRows(await query)
    if (!row) throw new ChatConversationNotFoundError()
    return row
  }

  private async assertTeamMember(user: User): Promise<number> {
    const eligible = await this.team.findEligibleExpert(user.id)
    if (!eligible) throw new ChatForbiddenError()
    return eligible.organizationId
  }

  private async platformMemberIds(): Promise<number[]> {
    const platformId = await this.platformOrganization.getId()
    const members = await User.query()
      .where('organizationId', platformId)
      .whereIn('role', [...PLATFORM_TEAM_ROLES])
      .whereNull('deletedAt')
      .select('id')
    return members.map((member) => member.id)
  }

  private async ownEmployee(user: User): Promise<Employee> {
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()
    if (!employee) throw new CandidateProfileNotFoundError()
    return employee
  }
}
