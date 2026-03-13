import { Head } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EmployeeHome from '../../components/dashboard/EmployeeHome'

export default function CandidatHome() {
  return (
    <>
      <Head title="Tableau de bord - Candidat" />
      <DashboardLayout>
        <EmployeeHome />
      </DashboardLayout>
    </>
  )
}
