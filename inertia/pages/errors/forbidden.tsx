import { ErrorPage } from '~/components/errors/ErrorPage'

interface ForbiddenProps {
  /** Texte du refus posé par le middleware de rôle (jamais un détail technique). */
  message?: string
}

export default function Forbidden({ message }: ForbiddenProps) {
  return (
    <ErrorPage
      code={403}
      title="Accès refusé"
      message={message ?? 'Vous n’avez pas accès à cette page.'}
    />
  )
}
