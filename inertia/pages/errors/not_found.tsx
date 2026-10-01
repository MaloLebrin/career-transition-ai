import { ErrorPage } from '~/components/errors/ErrorPage'

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      title="Page introuvable"
      message="La page demandée n’existe pas ou a été déplacée."
    />
  )
}
