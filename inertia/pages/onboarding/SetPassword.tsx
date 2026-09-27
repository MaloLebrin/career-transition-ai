import { Head, useForm } from '@inertiajs/react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'

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
      <PublicLayout headerProps={{ showAction: false }}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-sage/10 text-brand-sage flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
                Bienvenue, {userName}
              </h1>
              <p className="text-brand-navy/60 text-sm mt-2">
                Votre espace est prêt. Créez votre mot de passe pour vous connecter et commencer vos
                exercices.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {throttled && (
                <p role="alert" className="text-sm text-rose-600 font-medium">
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
          </Card>
        </div>
      </PublicLayout>
    </>
  )
}
