import { Head, router } from '@inertiajs/react'
import LoginPage from '../components/auth/LoginPage'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login, error } = useAuth()

  return (
    <>
      <Head title="Connexion" />
      <LoginPage
        login={login}
        error={error}
        onBackToLanding={() => router.visit('/')}
        onAuthSuccess={() => { window.location.href = '/dashboard' }}
        onGoToRegister={() => router.visit('/auth/register')}
      />
    </>
  )
}
