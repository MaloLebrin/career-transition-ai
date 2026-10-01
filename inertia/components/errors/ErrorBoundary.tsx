import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from '../ui/Button'
import { ErrorPage } from './ErrorPage'

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
      <div role="alert">
        <ErrorPage
          code={500}
          title="Une erreur est survenue"
          message="La page n’a pas pu s’afficher. Rechargez-la ; si le problème persiste, revenez à l’accueil."
        >
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
        </ErrorPage>
      </div>
    )
  }
}
