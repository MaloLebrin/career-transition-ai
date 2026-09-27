import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Filet de sécurité autour de toute l'app Inertia (`inertia/app.tsx`) : une
 * erreur de rendu React affiche un message et une sortie au lieu d'une page
 * blanche (issue #27). Les erreurs serveur, elles, sont suivies côté backend.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main
        role="alert"
        className="min-h-screen flex items-center justify-center bg-brand-ivory px-6 text-center"
      >
        <div className="max-w-md space-y-6">
          <h1 className="text-2xl font-bold text-brand-navy">Une erreur est survenue</h1>
          <p className="text-brand-navy/70">
            La page n’a pas pu s’afficher. Rechargez-la ; si le problème persiste, revenez à
            l’accueil.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-brand-sage px-6 py-3 text-sm font-bold text-white cursor-pointer hover:bg-brand-sage/90"
            >
              Recharger la page
            </button>
            <a
              // eslint-disable-next-line no-restricted-syntax -- rechargement complet voulu : après un crash React, l'état client n'est plus fiable
              href="/"
              className="rounded-2xl border-2 border-brand-navy/10 bg-white px-6 py-3 text-sm font-bold text-brand-navy hover:border-brand-navy"
            >
              Retour à l’accueil
            </a>
          </div>
        </div>
      </main>
    )
  }
}
