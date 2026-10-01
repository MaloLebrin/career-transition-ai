import { Head, router } from '@inertiajs/react'
import LandingPage from '~/components/landing/LandingPage'

export default function Home() {
  return (
    <>
      <Head title="Logiciel de bilan de compétences pour cabinets" />
      <LandingPage onEnterApp={() => router.visit('/auth/login')} />
    </>
  )
}
