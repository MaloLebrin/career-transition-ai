import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import OrganizationSettings from '../../components/OrganizationSettings'
import { useAuth } from '../../hooks/useAuth'

export default function DashboardSettings() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth')
  }, [user])

  if (!user) return null

  return (
    <>
      <Head title="Réglages" />
      <DashboardLayout>
        <div className="animate-fadeIn">
          <OrganizationSettings
            organizationId={user.organizationId || 'ftc-paris'}
            onBack={() => router.visit('/dashboard')}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
