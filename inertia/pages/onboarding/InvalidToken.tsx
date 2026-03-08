import React from 'react'
import { Head, router } from '@inertiajs/react'
import AppLink from '../../components/ui/AppLink'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

interface InvalidTokenProps {
  expired?: boolean
}

export default function InvalidToken({ expired }: InvalidTokenProps) {
  return (
    <>
      <Head title="Lien invalide" />
      <PublicLayout headerProps={{ onLogoClick: () => router.visit('/'), showAction: false }}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
              {expired ? 'Lien expiré' : 'Lien invalide'}
            </h1>
            <p className="text-brand-navy/60 text-sm mt-3">
              {expired
                ? 'Ce lien d’activation a expiré. Contactez votre conseiller pour recevoir un nouveau lien.'
                : 'Ce lien est invalide ou a déjà été utilisé.'}
            </p>
            <div className="mt-6">
              <AppLink href="/auth/login">
                <Button variant="outline" size="md">
                  Aller à la connexion
                </Button>
              </AppLink>
            </div>
          </Card>
        </div>
      </PublicLayout>
    </>
  )
}
