import { Head, router } from '@inertiajs/react'
import OfferPage from '../components/marketing/OfferPage'

export default function Offer() {
  return (
    <>
      <Head title="Offre" />
      <OfferPage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}

