import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import AdvisorHome from '../../components/dashboard/AdvisorHome'
import EmployeeHome from '../../components/dashboard/EmployeeHome'
import OnboardingFlow from '../../components/onboarding/OnboardingFlow'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'
import { isAdvisorOrAdmin } from '../../helpers/roles'
import { employeeUpdatePayload } from '../../helpers/employee_payload'

export default function DashboardHome() {
  const { user } = useAuth()
  const userRole = user?.role || 'employee'
  const targetId = user?.id || '1'
  const { employee: selectedEmployee } = useEmployee(targetId)

  useEffect(() => {
    if (!user) {
      router.visit('/auth/login')
    }
  }, [user])

  if (!user) return null

  if (!isAdvisorOrAdmin(userRole) && selectedEmployee && !selectedEmployee.onboarded) {
    return (
      <>
        <Head title="Onboarding" />
        <DashboardLayout>
          <OnboardingFlow
            employee={selectedEmployee}
            onComplete={(updated) => {
              router.put(`/dashboard/employees/${targetId}`, employeeUpdatePayload(updated), {
                onSuccess: () => router.reload(),
              })
            }}
          />
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title="Tableau de bord" />
      <DashboardLayout>
        {isAdvisorOrAdmin(userRole) ? <AdvisorHome /> : <EmployeeHome />}
      </DashboardLayout>
    </>
  )
}
