import { Head, router } from '@inertiajs/react'
import { CHAT_ASSIGNMENTS, CHAT_AUTHOR_ROLES, CHAT_PATHS } from '#shared/constants/chat'
import type { ExpertChatShowPageProps } from '#shared/types/chat/views'
import { ChatComposer } from '~/components/chat/ChatComposer'
import { ChatThread } from '~/components/chat/ChatThread'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { useChatConversation } from '~/hooks/use_chat_conversation'

/** Conversation d'un candidat côté expert ; « Prendre » la sort de la file d'attente. */
export default function ExpertChatShowPage({
  conversation,
  messages: initialMessages,
  hasMore: initialHasMore,
}: ExpertChatShowPageProps) {
  const { messages, hasMore, loadingMore, loadMore } = useChatConversation({
    channel: conversation.channel,
    messages: initialMessages,
    hasMore: initialHasMore,
    viewerRole: CHAT_AUTHOR_ROLES.EXPERT,
    readPath: CHAT_PATHS.expertRead(conversation.id),
  })
  const inQueue = conversation.assignment === CHAT_ASSIGNMENTS.QUEUE

  const claim = () => {
    router.post(CHAT_PATHS.expertClaim(conversation.id), {}, { preserveScroll: true })
  }

  return (
    <DashboardLayout>
      <Head title={`Messages · ${conversation.candidateLabel}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in">
        <AppLink
          href={CHAT_PATHS.expert}
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Retour aux messages
        </AppLink>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-display-sm text-ink">{conversation.candidateLabel}</h1>
          {inQueue && <Button onClick={claim}>Prendre</Button>}
        </div>

        {conversation.assignment === CHAT_ASSIGNMENTS.OTHER && (
          <Card variant="flat" padding="md" role="status">
            <p className="text-sm text-ink-soft">
              Cette conversation est prise par un autre expert.
            </p>
          </Card>
        )}

        <ChatThread
          messages={messages}
          viewerRole={CHAT_AUTHOR_ROLES.EXPERT}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
        <ChatComposer postUrl={CHAT_PATHS.expertMessages(conversation.id)} />
      </div>
    </DashboardLayout>
  )
}
