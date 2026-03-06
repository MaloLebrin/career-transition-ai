import { Head, router } from '@inertiajs/react'
import RegisterPage from '../components/auth/RegisterPage'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register, error } = useAuth()

  return (
    <>
      <Head title="Création de compte" />
      <RegisterPage
        register={register}
        error={error}
        onBackToLanding={() => router.visit('/')}
        onAuthSuccess={() => router.visit('/dashboard')}
        onGoToLogin={() => router.visit('/auth/login')}
      />
    </>
  )
}
