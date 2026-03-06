import { Head, router } from '@inertiajs/react'
import AuthPage from '../components/auth/AuthPage'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { login, register, error } = useAuth()

  return (
    <>
      <Head title="Connexion" />
      <AuthPage
        login={login}
        register={register}
        error={error}
        onBackToLanding={() => router.visit('/')}
        onAuthSuccess={() => router.visit('/dashboard')}
      />
    </>
  )
}
