import { router } from '@inertiajs/react'
import { AlertCircle } from 'lucide-react'
import React, { useState } from 'react'
import { hasErrors, validateRegister, type RegisterErrors } from '../../helpers/auth_validation'
import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { AuthShell } from './AuthShell'

interface RegisterPageProps {
  csrfToken?: string
  onGoToLogin: () => void
  error: string | null
  /** Inscription des particuliers (#93) ouverte : sinon le renvoi vers `/inscription` est masqué. */
  candidateRegistrationEnabled?: boolean
}

export default function RegisterPage({
  csrfToken,
  onGoToLogin,
  error,
  candidateRegistrationEnabled = false,
}: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { email, password, name, organizationName, role: 'advisor' as const }
    const nextErrors = validateRegister(data)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      return
    }

    setIsLoading(true)
    router.post(
      '/auth/register',
      {
        email: data.email.trim(),
        password: data.password,
        name: data.name.trim(),
        organizationName: data.organizationName.trim(),
        role: data.role,
        ...(csrfToken ? { _csrf: csrfToken } : {}),
      },
      {
        onFinish: () => setIsLoading(false),
      }
    )
  }

  return (
    <AuthShell
      title="Création de compte cabinet"
      subtitle="Remplissez les champs pour créer l’espace de votre cabinet."
      footer={
        <div className="space-y-2">
          <p>
            Vous avez déjà un compte ?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </p>
          {candidateRegistrationEnabled && (
            <p>
              Vous êtes un particulier ?{' '}
              <AppLink
                href={B2C_PUBLIC_PATHS.register}
                className="font-medium text-accent hover:underline"
              >
                Créer mon compte
              </AppLink>
            </p>
          )}
        </div>
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

      <form
        action="/auth/register"
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}
        <Input
          label="Organisation / Cabinet"
          placeholder="Cabinet Horizon Paris"
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={errors.organizationName}
        />
        <Input
          label="Nom complet"
          placeholder="Jean Dupont"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
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
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="Au moins 6 caractères."
        />
        <p className="text-sm text-muted">
          Compte conseiller : vous pourrez ensuite inviter votre équipe et vos candidats.
        </p>
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  )
}
