import { Head, router } from '@inertiajs/react'
import LandingPage from '~/components/landing/LandingPage'

export default function Home() {
  return (
    <>
      <Head title="France Transition Carrière" />
      <LandingPage onEnterApp={() => router.visit('/auth/login')} />
    </>
  )
}
