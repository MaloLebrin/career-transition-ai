import { ErrorPage } from '~/components/errors/ErrorPage'

export default function TooManyRequests() {
  return (
    <ErrorPage
      code={429}
      title="Trop de tentatives"
      message="Vous avez effectué trop de requêtes en peu de temps. Patientez quelques instants, puis réessayez."
    />
  )
}
