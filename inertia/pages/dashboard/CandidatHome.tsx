import { Head } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EmployeeHome from '../../components/dashboard/EmployeeHome'
import { EmployeeData } from '../../types/Employee'

export default function CandidatHome({
  employee,
}: { employee: EmployeeData }) {
  return (
    <>
      <Head title="Tableau de bord - Candidat" />
      <DashboardLayout>
        <EmployeeHome employee={employee} />
      </DashboardLayout>
    </>
  )
}
