import { Head, usePage } from '@inertiajs/react'
import type { AdvisorHomeProps } from '~/types/employee'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { AdvisorHome } from '../../components/dashboard/advisor/home/AdvisorHome'

export default function ConseillerHome() {
  const { props } = usePage<AdvisorHomeProps>()

  return (
    <>
      <Head title="Tableau de bord - Conseiller" />
      <DashboardLayout>
        <AdvisorHome
          stats={props.stats}
          accompaniments={props.accompaniments}
          upcomingAppointments={props.upcomingAppointments}
        />
      </DashboardLayout>
    </>
  )
}
