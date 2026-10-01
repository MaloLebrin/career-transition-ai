import { Head, router, usePage } from '@inertiajs/react'
import RegisterPage from '../components/auth/RegisterPage'

export default function Register() {
  const { props } = usePage<{ csrfToken?: string; flash?: { error?: string } }>()
  const flashError = props.flash?.error

  return (
    <>
      <Head title="Création de compte" />
      <RegisterPage
        csrfToken={props.csrfToken}
        error={flashError ?? null}
        onGoToLogin={() => router.visit('/auth/login')}
      />
    </>
  )
}
