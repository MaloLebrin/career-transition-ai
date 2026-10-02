import { router } from '@inertiajs/react'
import { AlertCircle } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { hasErrors, validateLogin, type LoginErrors } from '../../helpers/auth_validation'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { AuthShell } from './AuthShell'

interface LoginPageProps {
  csrfToken?: string
  error: string | null
  /** Message de succès (ex. après réinitialisation du mot de passe). */
  success?: string | null
  /** Absent quand l'inscription publique est fermée : le lien est masqué. */
  onGoToRegister?: () => void
}

export default function LoginPage({ csrfToken, error, success, onGoToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const data = { email: email.trim(), password }
      const nextErrors = validateLogin(data)
      setErrors(nextErrors)
      if (hasErrors(nextErrors)) {
        return
      }
      setIsLoading(true)
      router.post(
        '/auth/login',
        {
          email: data.email,
          password: data.password,
          ...(csrfToken ? { _csrf: csrfToken } : {}),
        },
        {
          onFinish: () => setIsLoading(false),
        }
      )
    },
    [email, password, csrfToken, router]
  )

  return (
    <AuthShell
      title="Connexion"
      subtitle="Saisissez vos identifiants pour continuer."
      footer={
        onGoToRegister ? (
          <p>
            Vous n’avez pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              S’inscrire gratuitement
            </button>
          </p>
        ) : undefined
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger animate-shake"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-success/20 bg-success-soft p-4 text-sm text-success"
        >
          {success}
        </p>
      )}

      <form
        action="/auth/login"
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}
        <Input
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="votre@email.fr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="-mt-2 text-right">
          <AppLink
            href="/auth/forgot-password"
            className="text-sm font-medium text-accent hover:underline"
          >
            Mot de passe oublié ?
          </AppLink>
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Se connecter
        </Button>
      </form>
    </AuthShell>
  )
}
