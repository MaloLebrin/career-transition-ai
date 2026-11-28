import type { Advisor } from '#shared/types/advisor/roles'
import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import OrganizationSettings from '~/components/settings/OrganizationSettings'
import type { Organization } from '~/types'

interface DashboardSettingsProps {
  organization: Organization
  members: Advisor[]
  /** Nouvelle adresse e-mail en attente de confirmation (#143). */
  pendingEmail?: string | null
}

export default function DashboardSettings({
  organization,
  members,
  pendingEmail = null,
}: DashboardSettingsProps) {
  return (
    <>
      <Head title="Réglages" />
      <DashboardLayout>
        <div className="animate-fadeIn">
          <OrganizationSettings
            organization={organization}
            members={members}
            pendingEmail={pendingEmail}
            onBack={() => router.visit('/dashboard/conseiller')}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
