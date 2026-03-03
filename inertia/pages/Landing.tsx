import { Head, router } from '@inertiajs/react'
import LandingPage from '../components/LandingPage'

export default function Landing() {
  return (
    <>
      <Head title="France Transition Carrière" />
      <LandingPage onEnterApp={() => router.visit('/auth')} />
    </>
  )
}

