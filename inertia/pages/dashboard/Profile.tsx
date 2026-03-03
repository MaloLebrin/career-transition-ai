import React, { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/DashboardLayout'
import ProfilePage from '../../components/ProfilePage'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/useEmployee'

export default function DashboardProfile() {
  const { user } = useAuth()
  const targetId = user?.id || '1'
  const { employee: selectedEmployee, updateProfile } = useEmployee(targetId)

  useEffect(() => {
    if (!user) router.visit('/auth')
  }, [user])

  if (!user) return null
  if (!selectedEmployee) {
    return (
      <>
        <Head title="Mon profil" />
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head title="Mon profil" />
      <DashboardLayout>
        <ProfilePage
          employee={selectedEmployee}
          onSave={(updated) => {
            updateProfile(updated)
            router.visit('/dashboard')
          }}
          onBack={() => router.visit('/dashboard')}
        />
      </DashboardLayout>
    </>
  )
}
