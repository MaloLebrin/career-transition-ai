import { Head } from '@inertiajs/react'
import { TriangleAlert } from 'lucide-react'
import { AuthShell } from '~/components/auth/AuthShell'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'

interface InvalidTokenProps {
  expired?: boolean
}

export default function InvalidToken({ expired }: InvalidTokenProps) {
  return (
    <>
      <Head title="Lien invalide" />
      <AuthShell
        title={expired ? 'Lien expiré' : 'Lien invalide'}
        subtitle={
          expired
            ? 'Ce lien d’activation a expiré. Contactez votre conseiller pour recevoir un nouveau lien.'
            : 'Ce lien est invalide ou a déjà été utilisé.'
        }
        icon={<TriangleAlert size={24} />}
        iconTone="warning"
        accent="warm"
      >
        <div className="text-center">
          <AppLink href="/auth/login" className={buttonClassName({ variant: 'outline' })}>
            Aller à la connexion
          </AppLink>
        </div>
      </AuthShell>
    </>
  )
}
