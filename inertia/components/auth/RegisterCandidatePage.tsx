import { useForm } from '@inertiajs/react'
import { AlertCircle } from 'lucide-react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { AuthShell } from './AuthShell'

export interface RegisterCandidatePageProps {
  /** Message d'erreur global (flash : e-mail déjà utilisé…). */
  error: string | null
}

/** Même règle que `registerCandidateValidator` (serveur). */
export const CANDIDATE_PASSWORD_HINT = 'Au moins 8 caractères.'

/**
 * Inscription d'un particulier (#93, `/inscription`) : compte candidat créé
 * seul, sans cabinet. Les erreurs de champ viennent du serveur (`useForm`),
 * la case CGU est obligatoire et renvoie vers `/cgu`, lisible sans quitter
 * le formulaire (nouvel onglet, lien natif via `external`).
 */
export default function RegisterCandidatePage({ error }: RegisterCandidatePageProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    acceptTerms: false,
  })
  const throttled = rateLimitError(errors)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/auth/register/candidat', { preserveScroll: true })
  }

  return (
    <AuthShell
      title="Créer mon compte"
      subtitle="Commencez votre bilan de transition : les exercices Motivations et Valeurs sont gratuits."
      footer={
        <p>
          Vous avez déjà un compte ?{' '}
          <AppLink href="/auth/login" className="font-medium text-accent hover:underline">
            Se connecter
          </AppLink>
        </p>
      }
    >
      {(error || throttled) && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger animate-shake"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>{error ?? throttled}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Input
          name="name"
          label="Nom complet"
          autoComplete="name"
          placeholder="Camille Durand"
          required
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          error={errors.name}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="votre@email.fr"
          required
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          error={errors.email}
        />
        <Input
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          error={errors.password}
          hint={CANDIDATE_PASSWORD_HINT}
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={data.acceptTerms}
              onChange={(e) => setData('acceptTerms', e.target.checked)}
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={errors.acceptTerms ? 'accept-terms-error' : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline-strong accent-primary focus:ring-accent"
            />
            <span>
              J’ai lu et j’accepte les{' '}
              <AppLink href="/cgu" external className="font-medium text-accent hover:underline">
                conditions générales d’utilisation
              </AppLink>{' '}
              et la{' '}
              <AppLink
                href="/confidentialite"
                external
                className="font-medium text-accent hover:underline"
              >
                politique de confidentialité
              </AppLink>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="accept-terms-error" role="alert" className="mt-2 text-sm text-danger">
              {errors.acceptTerms}
            </p>
          )}
        </div>

        <p className="text-sm text-muted">
          Compte particulier : vous avancez seul, et pourrez demander l’accompagnement d’un expert
          plus tard.
        </p>

        <Button type="submit" className="w-full" size="lg" isLoading={processing}>
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  )
}
