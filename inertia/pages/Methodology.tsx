import { Head, router } from '@inertiajs/react'
import MethodologyPage from '../components/marketing/MethodologyPage'

export default function Methodology() {
  return (
    <>
      <Head title="Méthodologie" />
      <MethodologyPage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
      />
    </>
  )
}

