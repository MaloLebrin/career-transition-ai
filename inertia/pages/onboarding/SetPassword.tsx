import React from 'react'
import { Head, useForm, router } from '@inertiajs/react'
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

  return (
    <>
      <Head title="Créer votre mot de passe" />
      <PublicLayout headerProps={{ onLogoClick: () => router.visit('/offre'), showAction: false }}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
                Bienvenue, {userName}
              </h1>
              <p className="text-brand-navy/60 text-sm mt-2">
                Votre espace est prêt. Créez votre mot de passe pour vous connecter et commencer vos
                exercices.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
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
