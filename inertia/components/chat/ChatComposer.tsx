import { CHAT_MESSAGE_MAX } from '#shared/constants/chat'
import { useForm } from '@inertiajs/react'
import type { FormEvent, KeyboardEvent } from 'react'
import Button from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'

interface ChatComposerProps {
  /** URL du `POST` d'un message (`CHAT_PATHS.candidateMessages` / `expertMessages(id)`). */
  postUrl: string
  disabled?: boolean
}

/** Zone de saisie : Entrée envoie, Maj+Entrée insère un retour à la ligne. */
export function ChatComposer({ postUrl, disabled = false }: ChatComposerProps) {
  const form = useForm({ body: '' })
  const empty = form.data.body.trim().length === 0

  const send = () => {
    if (empty || form.processing || disabled) return
    form.post(postUrl, {
      preserveScroll: true,
      only: ['messages', 'conversation', 'hasMore', 'errors'],
      onSuccess: () => form.reset(),
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    send()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        aria-label="Votre message"
        placeholder="Écrivez votre message…"
        rows={3}
        maxLength={CHAT_MESSAGE_MAX}
        value={form.data.body}
        onChange={(event) => form.setData('body', event.target.value)}
        onKeyDown={handleKeyDown}
        error={form.errors.body}
        hint="Entrée pour envoyer, Maj+Entrée pour un retour à la ligne."
        disabled={disabled}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={empty || form.processing || disabled}>
          Envoyer
        </Button>
      </div>
    </form>
  )
}
