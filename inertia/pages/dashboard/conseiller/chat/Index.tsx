import { Head } from '@inertiajs/react'
import { MessageCircle } from 'lucide-react'
import type { ExpertChatIndexPageProps } from '#shared/types/chat/views'
import { ChatConversationList } from '~/components/chat/ChatConversationList'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { Eyebrow } from '~/components/ui/Eyebrow'

/** Messagerie de l'équipe d'experts : file d'attente et conversations en cours. */
export default function ExpertChatIndexPage({ conversations }: ExpertChatIndexPageProps) {
  return (
    <DashboardLayout>
      <Head title="Messages" />
      <div className="w-full space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Eyebrow icon={<MessageCircle className="h-4 w-4" />}>Messagerie</Eyebrow>
          <h1 className="font-display text-display-sm text-ink">Messages des candidats</h1>
        </div>
        <ChatConversationList conversations={conversations} />
      </div>
    </DashboardLayout>
  )
}
