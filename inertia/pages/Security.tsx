import { Head, router } from '@inertiajs/react'
import SecurityPage from '../components/marketing/SecurityPage'

export default function Security() {
  return (
    <>
      <Head title="Sécurité" />
      <SecurityPage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}

