import { Head, useForm, usePage } from '@inertiajs/react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import PublicLayout from '~/components/layout/PublicLayout'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
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
      <PublicLayout headerProps={{ showAction: false }}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
                Mot de passe oublié
              </h1>
              <p className="text-brand-navy/60 text-sm mt-2">
                Saisissez l’adresse e-mail de votre compte : nous vous envoyons un lien pour choisir
                un nouveau mot de passe.
              </p>
            </div>

            {sent && (
              <p
                role="status"
                className="mb-6 p-4 rounded-2xl bg-brand-sage/10 border border-brand-sage/30 text-sm text-brand-navy"
              >
                {sent}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {throttled && (
                <p role="alert" className="text-sm text-rose-600 font-medium">
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

            <div className="mt-8 text-center">
              <AppLink
                href="/auth/login"
                className="text-sm text-brand-sage font-semibold hover:underline"
              >
                Retour à la connexion
              </AppLink>
            </div>
          </Card>
        </div>
      </PublicLayout>
    </>
  )
}
