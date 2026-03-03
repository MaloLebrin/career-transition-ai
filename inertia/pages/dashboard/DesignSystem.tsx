import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import DesignSystem from '../../components/DesignSystem'
import { useAuth } from '../../hooks/useAuth'

export default function DashboardDesignSystem() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth')
  }, [user])

  if (!user) return null

  return (
    <>
      <Head title="Design System" />
      <DashboardLayout>
        <div className="animate-fadeIn">
          <DesignSystem onBack={() => router.visit('/dashboard')} />
        </div>
      </DashboardLayout>
    </>
  )
}
