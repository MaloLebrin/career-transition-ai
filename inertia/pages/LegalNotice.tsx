import { Head, router } from '@inertiajs/react'
import LegalNoticePage from '../components/marketing/LegalNoticePage'

export default function LegalNotice() {
  return (
    <>
      <Head title="Mentions légales" />
      <LegalNoticePage
        onEnterApp={() => router.visit('/auth/login')}
        onBackToHome={() => router.visit('/')}
        onOffer={() => router.visit('/offre')}
        onMethodology={() => router.visit('/methodologie')}
      />
    </>
  )
}

