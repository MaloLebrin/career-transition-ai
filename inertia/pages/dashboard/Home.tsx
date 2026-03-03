import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import AdvisorHome from '../../components/dashboard/AdvisorHome'
import EmployeeHome from '../../components/dashboard/EmployeeHome'
import OnboardingFlow from '../../components/OnboardingFlow'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'

export default function DashboardHome() {
  const { user } = useAuth()
  const userRole = user?.role || 'employee'
  const targetId = user?.id || '1'
  const { employee: selectedEmployee, updateProfile } = useEmployee(targetId)

  useEffect(() => {
    if (!user) {
      router.visit('/auth')
    }
  }, [user])

  if (!user) return null

  if (userRole === 'employee' && selectedEmployee && !selectedEmployee.onboarded) {
    return (
      <>
        <Head title="Onboarding" />
        <DashboardLayout>
          <OnboardingFlow employee={selectedEmployee} onComplete={(updated) => updateProfile(updated)} />
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title="Tableau de bord" />
      <DashboardLayout>
        {userRole === 'advisor' ? <AdvisorHome /> : <EmployeeHome />}
      </DashboardLayout>
    </>
  )
}
