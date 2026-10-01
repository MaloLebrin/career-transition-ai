import { Head, useForm, usePage } from '@inertiajs/react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import { AuthShell } from '~/components/auth/AuthShell'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'

/** « Mot de passe oublié » (#68) : demande d'un lien de réinitialisation par e-mail. */
export default function ForgotPassword() {
  const { props } = usePage<{ flash?: { success?: string } }>()
  const sent = props.flash?.success
  const { data, setData, post, processing, errors } = useForm({ email: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/auth/forgot-password', { preserveScroll: true })
  }
  const throttled = rateLimitError(errors)

  return (
    <>
      <Head title="Mot de passe oublié" />
      <AuthShell
        title="Mot de passe oublié"
        subtitle="Saisissez l’adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
        footer={
          <AppLink href="/auth/login" className="font-medium text-accent hover:underline">
            Retour à la connexion
          </AppLink>
        }
      >
        {sent && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-success/20 bg-success-soft p-4 text-sm text-success"
          >
            {sent}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {throttled && (
            <p role="alert" className="text-sm text-danger">
              {throttled}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="votre@email.fr"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            error={errors.email}
          />
          <Button type="submit" className="w-full" size="lg" disabled={processing}>
            {processing ? 'Envoi…' : 'Recevoir le lien'}
          </Button>
        </form>
      </AuthShell>
    </>
  )
}
