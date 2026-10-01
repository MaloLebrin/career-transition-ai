import { Head } from '@inertiajs/react'
import PublicLayout from '../../components/layout/PublicLayout'
import AppLink from '../../components/ui/AppLink'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

interface InvalidTokenProps {
  expired?: boolean
}

export default function InvalidToken({ expired }: InvalidTokenProps) {
  return (
    <>
      <Head title="Lien invalide" />
      <PublicLayout header={{ minimal: true }} footer={false}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center border-t-[3px] border-t-brand-terracotta">
            <div className="w-14 h-14 rounded-2xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-7 h-7 stroke-[1.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
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
