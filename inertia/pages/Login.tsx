import { Head, usePage } from '@inertiajs/react'
import LoginPage from '../components/auth/LoginPage'

export default function Login() {
  const { props } = usePage<{
    csrfToken?: string
    flash?: { error?: string; success?: string }
    b2cRegistrationEnabled?: boolean
  }>()
  const flashError = props.flash?.error

  return (
    <>
      <Head title="Connexion" />
      <LoginPage
        csrfToken={props.csrfToken}
        error={flashError ?? null}
        success={props.flash?.success ?? null}
        candidateRegistrationEnabled={Boolean(props.b2cRegistrationEnabled)}
      />
    </>
  )
}
