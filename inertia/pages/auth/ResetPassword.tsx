import { Head, useForm } from '@inertiajs/react'
import { TriangleAlert } from 'lucide-react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import { AuthShell } from '~/components/auth/AuthShell'
import AppLink from '~/components/ui/AppLink'
import Button, { buttonClassName } from '~/components/ui/Button'
import Input from '~/components/ui/Input'

interface ResetPasswordProps {
  /** Secret du lien, `null` quand le lien est inconnu, expiré ou déjà utilisé. */
  token: string | null
  expired: boolean
}

/** Nouveau mot de passe depuis un lien « mot de passe oublié » (#68). */
export default function ResetPassword({ token, expired }: ResetPasswordProps) {
  return (
    <>
      <Head title="Nouveau mot de passe" />
      {token ? <ResetForm token={token} /> : <InvalidLink expired={expired} />}
    </>
  )
}

function ResetForm({ token }: { token: string }) {
  const { data, setData, post, processing, errors } = useForm({
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/auth/password-reset/${token}`)
  }
  const throttled = rateLimitError(errors)

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez le mot de passe que vous utiliserez pour vous connecter."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {throttled && (
          <p role="alert" className="text-sm text-danger">
            {throttled}
          </p>
        )}
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
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
          autoComplete="new-password"
          required
          placeholder="Répétez le mot de passe"
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          error={errors.password_confirmation}
        />
        <Button type="submit" className="w-full" size="lg" disabled={processing}>
          {processing ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
        </Button>
      </form>
    </AuthShell>
  )
}

function InvalidLink({ expired }: { expired: boolean }) {
  return (
    <AuthShell
      title={expired ? 'Lien expiré' : 'Lien invalide'}
      subtitle={
        expired
          ? 'Ce lien de réinitialisation a expiré. Faites une nouvelle demande.'
          : 'Ce lien est invalide ou a déjà été utilisé.'
      }
      icon={<TriangleAlert size={24} />}
      iconTone="warning"
      accent="warm"
    >
      <div className="text-center">
        <AppLink
          href="/auth/forgot-password"
          className={buttonClassName({ variant: 'outline', size: 'md' })}
        >
          Demander un nouveau lien
        </AppLink>
      </div>
    </AuthShell>
  )
}
