import { Head, router } from '@inertiajs/react'
import AuthPage from '../components/auth/AuthPage'
import { useAuth } from '../hooks/use_auth'

export default function Auth() {
  const { error } = useAuth()

  return (
    <>
      <Head title="Connexion" />
      <AuthPage
        error={error}
        onBackToLanding={() => router.visit('/')}
        onAuthSuccess={() => { window.location.href = '/dashboard' }}
      />
    </>
  )
}
