import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EmployeeHome from '../../components/dashboard/EmployeeHome'
import OnboardingFlow from '../../components/onboarding/OnboardingFlow'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/use_employee'
import { employeeUpdatePayload } from '../../helpers/employee_payload'

export default function CandidatHome() {
  const { user } = useAuth()
  const targetId = user?.id || '1'
  const { employee: selectedEmployee } = useEmployee(targetId)

  useEffect(() => {
    if (!user) {
      router.visit('/auth/login')
    }
  }, [user])

  if (!user) return null

  if (selectedEmployee && !selectedEmployee.onboarded) {
    return (
      <>
        <Head title="Onboarding" />
        <DashboardLayout>
          <OnboardingFlow
            employee={selectedEmployee}
            onComplete={(updated) => {
              router.put('/dashboard/candidat/profile', {
                ...employeeUpdatePayload(updated),
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
