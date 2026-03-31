import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProfilePage from '../../components/profile/ProfilePage'
import { candidatProfileUpdatePayload } from '../../helpers/candidat_profile_payload'
import { useAuth } from '../../hooks/useAuth'
import { useEmployee } from '../../hooks/use_employee'

export default function CandidatProfile() {
  const { user } = useAuth()
  const targetId = user?.id || '1'
  const { employee: selectedEmployee } = useEmployee(targetId)

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
        <ProfilePage
          employee={selectedEmployee}
          onSave={(updated) => {
            router.put('/dashboard/candidat/profile', candidatProfileUpdatePayload(updated) as any, {
              onSuccess: () => router.visit('/dashboard/candidat'),
            })
          }}
          onBack={() => router.visit('/dashboard/candidat')}
        />
      </DashboardLayout>
    </>
  )
}
