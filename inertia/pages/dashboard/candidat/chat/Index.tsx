import { Head } from '@inertiajs/react'
import { MessageCircle } from 'lucide-react'
import { CHAT_AUTHOR_ROLES, CHAT_PATHS } from '#shared/constants/chat'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import type { CandidateChatPageProps } from '#shared/types/chat/views'
import { ChatComposer } from '~/components/chat/ChatComposer'
import { ChatThread } from '~/components/chat/ChatThread'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { useChatConversation } from '~/hooks/use_chat_conversation'
import { useEntitlement } from '~/hooks/use_entitlement'

/** Chat du candidat avec l'équipe d'experts (file d'attente puis expert assigné). */
export default function CandidateChatPage({
  conversation,
  messages: initialMessages,
  hasMore: initialHasMore,
}: CandidateChatPageProps) {
  const entitlement = useEntitlement()
  const { messages, hasMore, loadingMore, loadMore } = useChatConversation({
    channel: conversation.channel,
    messages: initialMessages,
    hasMore: initialHasMore,
    viewerRole: CHAT_AUTHOR_ROLES.CANDIDATE,
    readPath: CHAT_PATHS.candidateRead,
  })
  const showOffer = entitlement !== null && !entitlement.hasPaidAccess

  return (
    <DashboardLayout candidateSidebar>
      <Head title="Discuter avec un expert" />
      <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in">
        <AppLink
          href="/dashboard/candidat"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Retour à mon espace
        </AppLink>
        <div className="space-y-2">
          <Eyebrow icon={<MessageCircle className="h-4 w-4" />}>Messagerie</Eyebrow>
          <h1 className="font-display text-display-sm text-ink">Discuter avec un expert</h1>
          <p className="text-base text-ink-soft">
            {conversation.expert
              ? `Votre expert : ${conversation.expert.name}.`
              : 'Un expert de la plateforme vous répondra dès que possible.'}
          </p>
        </div>

        {showOffer && (
          <Card variant="flat" padding="md" role="note">
            <p className="text-sm text-ink-soft">
              Pour être suivi dans la durée par un expert,{' '}
              <AppLink
                href={EXPERT_REQUEST_PATHS.page}
                className="font-medium text-accent hover:underline"
              >
                découvrez l’accompagnement
              </AppLink>
              .
            </p>
          </Card>
        )}

        <ChatThread
          messages={messages}
          viewerRole={CHAT_AUTHOR_ROLES.CANDIDATE}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
        <ChatComposer postUrl={CHAT_PATHS.candidateMessages} />
      </div>
    </DashboardLayout>
  )
}
