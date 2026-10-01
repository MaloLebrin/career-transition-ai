import { Head, useForm } from '@inertiajs/react'
import { KeyRound } from 'lucide-react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import { AuthShell } from '~/components/auth/AuthShell'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'

interface SetPasswordProps {
  token: string
  userName: string
}

export default function SetPassword({ token, userName }: SetPasswordProps) {
  const { data, setData, post, processing, errors } = useForm({
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/onboarding/${token}`)
  }
  const throttled = rateLimitError(errors)

  return (
    <>
      <Head title="Créer votre mot de passe" />
      <AuthShell
        title={`Bienvenue, ${userName}`}
        subtitle="Votre espace est prêt. Créez votre mot de passe pour vous connecter et commencer vos exercices."
        icon={<KeyRound size={24} />}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {throttled && (
            <p role="alert" className="text-sm text-danger">
              {throttled}
            </p>
          )}
          <Input
            label="Mot de passe"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 caractères"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            error={errors.password}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            required
            placeholder="Repétez le mot de passe"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            error={errors.password_confirmation}
          />
          <Button type="submit" className="w-full" size="lg" disabled={processing}>
            {processing ? 'Création…' : 'Créer mon mot de passe et accéder à mon espace'}
          </Button>
        </form>
      </AuthShell>
    </>
  )
}
