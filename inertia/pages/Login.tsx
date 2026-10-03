import { Head, router, usePage } from '@inertiajs/react'
import LoginPage from '../components/auth/LoginPage'

export default function Login() {
  const { props } = usePage<{
    csrfToken?: string
    flash?: { error?: string; success?: string }
    registrationEnabled?: boolean
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
        onGoToRegister={
          props.registrationEnabled ? () => router.visit('/auth/register') : undefined
        }
        onGoToRegisterCandidate={
          props.b2cRegistrationEnabled ? () => router.visit('/inscription') : undefined
        }
      />
    </>
  )
}
