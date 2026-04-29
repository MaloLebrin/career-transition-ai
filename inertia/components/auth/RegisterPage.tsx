import { router } from '@inertiajs/react'
import React, { useState } from 'react'
import { hasErrors, validateRegister, type RegisterErrors } from '../../helpers/auth_validation'
import PublicLayout from '../layout/PublicLayout'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface RegisterPageProps {
  csrfToken?: string
  onGoToLogin: () => void
  error: string | null
}

export default function RegisterPage({ csrfToken, onGoToLogin, error }: RegisterPageProps) {
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
    <PublicLayout
      headerProps={{ showAction: false }}
      className="flex flex-col lg:flex-row overflow-hidden"
    >
      <div className="hidden lg:flex lg:w-1/2 bg-brand-navy relative items-center justify-center p-20 overflow-hidden pt-32">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-sage/10 blur-[120px] rounded-full -mr-96 -mt-96" />
        <div className="relative z-10 max-w-lg space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight tracking-tighter">
              Commencez votre nouvelle étape.
            </h1>
            <p className="text-brand-ivory/40 text-lg font-medium leading-relaxed">
              Accédez à vos diagnostics, suivez vos progrès et pilotez votre transition avec l’appui
              de l’IA.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-brand-sage font-bold text-2xl mb-1">2.5k+</div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Talents Accompagnés
              </div>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-brand-terracotta font-bold text-2xl mb-1">98%</div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Taux de Satisfaction
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grow flex items-center justify-center p-6 md:p-12 lg:p-24 relative pt-32 lg:pt-32">
        <Card className="w-full max-w-md border-none shadow-none bg-transparent lg:bg-white lg:p-12 lg:shadow-2xl lg:shadow-brand-navy/5 lg:border lg:border-brand-navy/5">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
              Création de compte
            </h2>
            <p className="text-brand-navy/40 font-medium">
              Remplissez les champs pour créer votre espace.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 animate-shake">
              <svg
                className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs font-bold text-rose-600">{error}</p>
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
              placeholder="France Transition Paris"
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
            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
              Création de compte <span className="text-brand-sage">Conseiller / Cabinet Expert</span>
            </p>
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Créer mon compte
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-brand-navy/5 text-center">
            <p className="text-sm text-brand-navy/60 font-medium">
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="ml-2 text-brand-sage font-bold uppercase text-[10px] tracking-widest hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>
        </Card>
      </div>
    </PublicLayout>
  )
}
