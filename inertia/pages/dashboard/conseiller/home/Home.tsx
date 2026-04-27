import { Head, usePage } from '@inertiajs/react'
import { AdvisorHome } from '~/components/dashboard/advisor/home/AdvisorHome'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import type { AdvisorHomeProps } from '~/types/employee'

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
