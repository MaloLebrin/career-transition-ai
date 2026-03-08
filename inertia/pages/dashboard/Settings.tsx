import React from 'react'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import OrganizationSettings from '../../components/settings/OrganizationSettings'
import type { Organization, Advisor } from '../../types'

interface DashboardSettingsProps {
  organization: Organization
  members: Advisor[]
}

export default function DashboardSettings({ organization, members }: DashboardSettingsProps) {
  return (
    <>
      <Head title="Réglages" />
      <DashboardLayout>
        <div className="animate-fadeIn">
          <OrganizationSettings
            organization={organization}
            members={members}
            onBack={() => router.visit('/dashboard/conseiller')}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
