import { Head, router } from '@inertiajs/react'
import { useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import DesignSystem from '../../../components/design-system/DesignSystem'
import { useAuth } from '../../../hooks/use_auth'

export default function DashboardDesignSystem() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) router.visit('/auth/login')
  }, [user])

  if (!user) return null

  return (
    <>
      <Head title="Design System" />
      <DashboardLayout>
        <div className="animate-fadeIn">
          <DesignSystem onBack={() => router.visit('/dashboard/super-admin')} />
        </div>
      </DashboardLayout>
    </>
  )
}
