import { useForm } from '@inertiajs/react'
import React, { useEffect, useState } from 'react'
import { UsageCompletionCard } from '~/components/dashboard/settings/usage/UsageCompletionCard'
import { useAuth } from '../../hooks/useAuth'
import { Advisor, AdvisorRole, Organization } from '../../types'
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

          <Card className="p-10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 flex items-center">
                <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3">
                  👥
                </span>
                Mon Équipe
              </h3>
              <Button onClick={() => setIsInviteModalOpen(true)} variant="ghost" size="sm">
                + Inviter un collaborateur
              </Button>
            </div>

            <div className="space-y-4">
              {team.length > 0 ? (
                team.map((member) => (
                  <TeamMember
                    key={member.id}
                    name={member.name}
                    role={member.role}
                    email={member.email}
                    isMe={user?.id === member.id}
                  />
                ))
              ) : (
                <p className="text-center py-8 text-slate-400 italic text-sm">
                  Aucun collaborateur trouvé.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Branding & Side Info */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="p-10 text-center space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Identité Visuelle
            </h3>
            <div className="relative group mx-auto w-32 h-32">
              <div className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400 transition-all cursor-pointer overflow-hidden">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Format carré, PNG ou SVG conseillé (Max 1Mo).
            </p>
          </Card>

          <UsageCompletionCard numberOfLicenses={team.length} />
        </div>
      </div>

      {isInviteModalOpen && <AddAdvisorModal onClose={() => setIsInviteModalOpen(false)} />}
    </div>
  )
}

// Fixed: Explicitly use React.FC and an interface for props to ensure TypeScript correctly handles React-reserved props like 'key'.
interface TeamMemberProps {
  name: string
  role: AdvisorRole
  email: string
  isMe?: boolean
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, email, isMe = false }) => {
  const roleDisplay = {
    admin: { label: 'Admin', variant: 'violet' as const },
    expert: { label: 'Expert', variant: 'indigo' as const },
    consultant: { label: 'Consultant', variant: 'cyan' as const },
  }[role] || { label: 'Inconnu', variant: 'slate' as const }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-black text-slate-900 flex items-center">
            {name}
            {isMe && (
              <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] rounded-full uppercase tracking-widest font-black">
                Moi
              </span>
            )}
            <span className="ml-2">
              <Badge variant={roleDisplay.variant}>{roleDisplay.label}</Badge>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold">{email}</div>
        </div>
      </div>
      {!isMe && (
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"
          title="Retirer l'accès"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      )}
    </div>
  )
}

export default OrganizationSettings
