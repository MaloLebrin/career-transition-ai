import { Head } from '@inertiajs/react'
import AdvisorHome from '../../components/dashboard/AdvisorHome'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

export default function ConseillerHome() {
  return (
    <>
      <Head title="Tableau de bord - Conseiller" />
      <DashboardLayout>
        <AdvisorHome />
      </DashboardLayout>
    </>
  )
}
