import { ErrorPage } from '~/components/errors/ErrorPage'

/** Le détail de l'erreur reste côté serveur (Sentry) : jamais `error.message` dans le DOM. */
export default function ServerError(_props: { error?: { message?: string } }) {
  return (
    <ErrorPage
      code={500}
      title="Une erreur est survenue"
      message="Nos équipes sont prévenues. Réessayez dans quelques instants."
    />
  )
}
