import type { Advisor } from '#shared/types/advisor/roles'
import React, { useMemo, useState } from 'react'
import { GeneralInfoForm } from '~/components/dashboard/settings/organisation/infos/GeneralInfoForm'
import { VisualIdentity } from '~/components/dashboard/settings/organisation/visual-identity/VisualIdentity'
import { TeamCard } from '~/components/dashboard/settings/team/TeamCard'
import { UsageCompletionCard } from '~/components/dashboard/settings/usage/UsageCompletionCard'
import { ProfileForm } from '~/components/profile/ProfileForm'
import { UserSession } from '~/types/auth'
import { MAX_LICENSES_ADVISORS } from '../../../shared/constants/organisation'
import { isOrganizationAdmin, isSuperAdmin } from '../../../shared/helpers/roles'
import { useAuth } from '../../hooks/use_auth'
import { Organization } from '../../types'
import { AddAdvisorModal } from '../modals/AddAdvisorModal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface Props {
  /** Passed from dashboard/Settings page (server-rendered). When omitted, loads via organizationId + API. */
  organization?: Organization
  members?: Advisor[]
  onBack: () => void
}

const OrganizationSettings: React.FC<Props> = ({
  organization: organizationProp,
  members: membersProp,
  onBack,
}) => {
  const { user } = useAuth()
  // Lu depuis les props (pas d'état local) : après un upload de logo, Inertia
  // renvoie l'organisation à jour.
  const org: Organization | undefined = organizationProp
  const [team] = useState<Advisor[]>(membersProp ?? [])
  const [success, setSuccess] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Aligné sur `middleware.admin()` des routes de mutation du cabinet.
  const canManage = isOrganizationAdmin(user?.role) || isSuperAdmin(user?.role)
  const canInvite = useMemo(
    () => canManage && team.length < MAX_LICENSES_ADVISORS,
    [canManage, team.length]
  )

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">
              Mon Cabinet
            </h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
              Identité visuelle et gestion d'équipe
            </p>
          </div>
        </div>
        {success && <Badge variant="lime">Action effectuée avec succès !</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Identité du Conseiller & Cabinet */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="space-y-8 p-10 border-2 border-violet-100 bg-white">
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center mr-3">
                👤
              </span>
              Mon Profil Personnel
            </h3>
            <ProfileForm user={user as UserSession} setSuccess={setSuccess} />
          </Card>

          <GeneralInfoForm organization={org} readOnly={!canManage} />

          <TeamCard
            team={team}
            setIsInviteModalOpen={setIsInviteModalOpen}
            user={user as UserSession}
            canInvite={canInvite}
          />
        </div>

        {/* Branding & Side Info */}
        <div className="lg:col-span-5 space-y-8">
          <VisualIdentity organization={org} readOnly={!canManage} />
          <UsageCompletionCard numberOfLicenses={team.length} />
        </div>
      </div>

      {isInviteModalOpen && <AddAdvisorModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  )
}

export default OrganizationSettings
