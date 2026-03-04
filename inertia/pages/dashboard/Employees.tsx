import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import type { Employee } from '../../types'

interface DashboardEmployeesProps {
  employees: Employee[]
}

export default function DashboardEmployees({ employees }: DashboardEmployeesProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth')
  }, [user])

  useEffect(() => {
    if (user?.role === 'advisor' && employees.length > 0) {
      router.visit(`/dashboard/employees/${employees[0].id}`)
    }
  }, [user?.role, employees])

  if (!user) return null

  return (
    <>
      <Head title="Candidats" />
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px] text-brand-navy/60">
          <p className="text-sm font-medium">Redirection...</p>
        </div>
      </DashboardLayout>
    </>
  )
}
