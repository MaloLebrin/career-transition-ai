import { Head, router } from '@inertiajs/react'
import LegalNoticePage from '../components/marketing/LegalNoticePage'

export default function LegalNotice() {
  return (
    <>
      <Head title="Mentions légales" />
      <LegalNoticePage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/offre')}
        onOffer={() => router.visit('/offre')}
        onTarifs={() => router.visit('/tarifs')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}

