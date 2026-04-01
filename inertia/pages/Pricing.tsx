import { Head, router } from '@inertiajs/react'
import PricingPage from '../components/marketing/PricingPage'

export default function Pricing() {
  return (
    <>
      <Head title="Tarifs" />
      <PricingPage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}
