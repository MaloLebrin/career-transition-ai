import { useForm } from '@inertiajs/react'
import React, { useEffect, useState } from 'react'
import { VisualIdentity } from '~/components/dashboard/settings/organisation/visual-identity/VisualIdentity'
import { TeamCard } from '~/components/dashboard/settings/team/TeamCard'
import { UsageCompletionCard } from '~/components/dashboard/settings/usage/UsageCompletionCard'
import { UserSession } from '~/types/auth'
import { useAuth } from '../../hooks/useAuth'
import { Advisor, Organization } from '../../types'
import AddAdvisorModal from '../modals/AddAdvisorModal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

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
  const [org] = useState<Organization | undefined>(organizationProp)
  const [team] = useState<Advisor[]>(membersProp ?? [])
  const [success, setSuccess] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const profileForm = useForm({ name: '', email: '' })
  const orgForm = useForm({ name: '', slug: '' })
  useEffect(() => {
    if (org) orgForm.setData({ name: org.name, slug: org.slug })
  }, [org?.id])

  useEffect(() => {
    if (user) {
      profileForm.setData({ name: user.name, email: user.email })
    }
  }, [user?.id])

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-10 pb-20">
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

            <form
              onSubmit={(e) => {
                e.preventDefault()
                profileForm.put('/dashboard/conseiller/profile', {
                  onSuccess: () => {
                    setSuccess(true)
                    setTimeout(() => setSuccess(false), 3000)
                  },
                })
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom complet"
                  value={profileForm.data.name}
                  onChange={(e) => profileForm.setData('name', e.target.value)}
                  placeholder="Votre nom"
                  error={profileForm.errors.name}
                />
                <Input
                  label="Email professionnel"
                  value={profileForm.data.email}
                  onChange={(e) => profileForm.setData('email', e.target.value)}
                  placeholder="votre@email.fr"
                  type="email"
                  error={profileForm.errors.email}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={profileForm.processing}
                  disabled={profileForm.processing}
                  variant="secondary"
                  className="w-full"
                >
                  Mettre à jour mon profil
                </Button>
              </div>
            </form>
          </Card>

          {/* Identité du Cabinet */}
          <Card className="space-y-8 p-10">
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                🏢
              </span>
              Informations Générales
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                orgForm.put('/dashboard/conseiller/settings/organization')
              }}
              className="space-y-6"
            >
              <Input
                label="Nom du Cabinet"
                value={orgForm.data.name}
                onChange={(e) => orgForm.setData('name', e.target.value)}
                placeholder="Ex: FTC Paris"
                error={orgForm.errors.name}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Slug URL"
                  value={orgForm.data.slug}
                  onChange={(e) => orgForm.setData('slug', e.target.value)}
                  placeholder="ftc-paris"
                  error={orgForm.errors.slug}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    Date de création
                  </label>
                  <div className="p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm text-slate-400">
                    {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={orgForm.processing}
                  disabled={orgForm.processing}
                  className="w-full shadow-indigo-100"
                >
                  Mettre à jour les infos
                </Button>
              </div>
            </form>
          </Card>

          <TeamCard
            team={team}
            setIsInviteModalOpen={setIsInviteModalOpen}
            user={user as UserSession}
          />
        </div>

        {/* Branding & Side Info */}
        <div className="lg:col-span-5 space-y-8">
          <VisualIdentity organization={org} />
          <UsageCompletionCard numberOfLicenses={team.length} />
        </div>
      </div>

      {isInviteModalOpen && <AddAdvisorModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  )
}

export default OrganizationSettings
