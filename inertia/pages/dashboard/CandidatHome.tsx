import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EmployeeHome from '../../components/dashboard/EmployeeHome'
import OnboardingFlow from '../../components/onboarding/OnboardingFlow'
import { employeeUpdatePayload } from '../../helpers/employee_payload'

type EmployeeData = {
  id: number
  organizationId: number
  userId: number
  name: string
  email: string
  currentRole: string
  targetRole: string | null
  summary: string | null
  advisorNotes: string | null
  status: string
  onboarded: boolean
  createdAt: string
  updatedAt: string
  skills: Array<{
    id: number
    name: string
    category: string | null
    level: number
  }>
  exercises: Array<{
    id: number
    type: string
    status: string
    date: string | null
    quantitativeScore: number | null
  }>
  plan: Array<{
    id: number
    title: string
    description: string | null
    completed: boolean
    associatedExercise: string | null
  }>
  experiences: Array<any>
  educations: Array<any>
}

export default function CandidatHome({
  employee,
}: { employee: EmployeeData }) {

  if (employee && !employee.onboarded) {
    return (
      <>
        <Head title="Onboarding" />
        <DashboardLayout>
          <OnboardingFlow
            employee={employee as any}
            onComplete={(updated) => {
              router.put('/dashboard/candidat/profile', {
                ...employeeUpdatePayload(updated as any),
                onboarded: true,
              }, {
                onSuccess: () => router.visit('/dashboard/candidat'),
              })
            }}
          />
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title="Tableau de bord - Candidat" />
      <DashboardLayout>
        <EmployeeHome />
      </DashboardLayout>
    </>
  )
}
