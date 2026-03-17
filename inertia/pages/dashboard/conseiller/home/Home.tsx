import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AdvisorHome from '~/components/dashboard/AdvisorHome'
import { useAuth } from '~/hooks/useAuth'

export default function ConseillerHome() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.visit('/auth/login')
    }
  }, [user])

  if (!user) return null

  return (
    <>
      <Head title="Tableau de bord - Conseiller" />
      <DashboardLayout>
        <AdvisorHome />
      </DashboardLayout>
    </>
  )
}
