import { Head, usePage } from '@inertiajs/react'
import RegisterCandidatePage from '../components/auth/RegisterCandidatePage'

/** `/inscription` (#93) : inscription d'un particulier, derrière `B2C_REGISTRATION_ENABLED`. */
export default function RegisterCandidate() {
  const { props } = usePage<{ flash?: { error?: string } }>()

  return (
    <>
      <Head title="Créer mon compte" />
      <RegisterCandidatePage error={props.flash?.error ?? null} />
    </>
  )
}
