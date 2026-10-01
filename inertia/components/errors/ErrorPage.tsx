import type { ReactNode } from 'react'
import { buttonClassName } from '../ui/Button'
import { Logo } from '../ui/Logo'

export interface ErrorPageProps {
  code: 404 | 500
  title: string
  message: string
  /** Actions complémentaires (ex. recharger la page). */
  children?: ReactNode
}

/**
 * Page d'erreur plein écran (404, 500, crash React). Rendue sans props partagées
 * Inertia : ni `usePage` ni `PublicLayout`, et un lien natif vers l'accueil pour
 * repartir d'un état client sain.
 */
export function ErrorPage({ code, title, message, children }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <Logo size="md" className="justify-center" />
        <div className="space-y-3">
          <p className="text-eyebrow text-muted">Erreur {code}</p>
          <h1 className="text-display-sm">{title}</h1>
          <p className="text-base text-muted">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            // eslint-disable-next-line no-restricted-syntax -- rechargement complet voulu : après une erreur serveur, l'état client n'est plus fiable
            href="/"
            className={buttonClassName({ variant: 'primary' })}
          >
            Retour à l’accueil
          </a>
          {children}
        </div>
      </div>
    </main>
  )
}
