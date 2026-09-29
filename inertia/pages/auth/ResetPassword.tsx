import { Head, useForm } from '@inertiajs/react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import PublicLayout from '~/components/layout/PublicLayout'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
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
      <PublicLayout headerProps={{ showAction: false }}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            {token ? <ResetForm token={token} /> : <InvalidLink expired={expired} />}
          </Card>
        </div>
      </PublicLayout>
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
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Nouveau mot de passe</h1>
        <p className="text-brand-navy/60 text-sm mt-2">
          Choisissez le mot de passe que vous utiliserez pour vous connecter.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {throttled && (
          <p role="alert" className="text-sm text-rose-600 font-medium">
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
    </>
  )
}

function InvalidLink({ expired }: { expired: boolean }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
        {expired ? 'Lien expiré' : 'Lien invalide'}
      </h1>
      <p className="text-brand-navy/60 text-sm mt-3">
        {expired
          ? 'Ce lien de réinitialisation a expiré. Faites une nouvelle demande.'
          : 'Ce lien est invalide ou a déjà été utilisé.'}
      </p>
      <div className="mt-6">
        <AppLink href="/auth/forgot-password">
          <Button variant="outline" size="md">
            Demander un nouveau lien
          </Button>
        </AppLink>
      </div>
    </div>
  )
}
