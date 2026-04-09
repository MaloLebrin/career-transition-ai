import { Head, router, usePage } from '@inertiajs/react'
import LoginPage from '../components/auth/LoginPage'

export default function Login() {
  const { props } = usePage<{ csrfToken?: string; flash?: { error?: string } }>()
  const flashError = props.flash?.error

  return (
    <>
      <Head title="Connexion" />
      <LoginPage
        csrfToken={props.csrfToken}
        error={flashError ?? null}
        onBackToLanding={() => router.visit('/offre')}
        onGoToRegister={() => router.visit('/auth/register')}
      />
    </>
  )
}
