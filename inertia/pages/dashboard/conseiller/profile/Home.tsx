import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import ProfilePage from '~/components/profile/ProfilePage'
import { useAuth } from '~/hooks/useAuth'
import { useEmployee } from '~/hooks/use_employee'
import { employeeUpdatePayload } from '~/helpers/employee_payload'

export default function ConseillerProfile() {
  const { user } = useAuth()
  const targetId = user?.id || '1'
  const { employee: selectedEmployee } = useEmployee(targetId)

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) return null
  if (!selectedEmployee) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <Head title="Mon profil" />
      <DashboardLayout>
        < ProfilePage
          employee={selectedEmployee}
          onSave={(updated) => {
            router.put('/dashboard/conseiller/profile', employeeUpdatePayload(updated) as any, {
              onSuccess: () => router.visit('/dashboard/conseiller/profile'),
            })
          }}
          onBack={() => router.visit('/dashboard/conseiller')}
        />
      </DashboardLayout>
    </>
  )
}
