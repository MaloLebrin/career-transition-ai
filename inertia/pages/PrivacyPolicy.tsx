import { Head, router } from '@inertiajs/react'
import PrivacyPolicyPage from '../components/marketing/PrivacyPolicyPage'

export default function PrivacyPolicy() {
  return (
    <>
      <Head title="Politique de confidentialité" />
      <PrivacyPolicyPage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/offre')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}

