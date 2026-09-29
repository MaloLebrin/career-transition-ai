import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { Head, usePage } from '@inertiajs/react'
import type { CandidateDataRights } from '#shared/types/candidate_data/requests'
import type { CandidateDocumentDto } from '#shared/types/media/documents'
import NotesSection from '~/components/dashboard/NotesSection'
import { CandidateDocuments } from '~/components/dashboard/employee/profile/documents/CandidateDocuments'
import { Skills } from '~/components/dashboard/employee/profile/Skills'
import { DataRights } from '~/components/dashboard/employee/profile/data_rights/DataRights'
import { IdentityForm } from '~/components/dashboard/employee/profile/identity/IdentityForm'
import { EducationsCard } from '~/components/dashboard/employee/profile/educations/EducationsCard'
import { ExperiencesCard } from '~/components/dashboard/employee/profile/experiences/experience_card/ExperiencesCard'
import type { Note } from '~/types/note'
import { EmployeeData } from '~/types'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Card from '~/components/ui/Card'
import { PasswordForm } from '~/components/profile/PasswordForm'
import { useAuth } from '~/hooks/use_auth'

interface AvailableSkill {
  id: number
  name: string
  category: string | null
}

interface EmployeeProfileProps {
  employeeId: string
  employee: EmployeeData
  availableSkills?: AvailableSkill[]
  notes?: Note[]
  documents?: CandidateDocumentDto[]
  /** Base des routes de documents : espace candidat ou fiche conseiller. */
  documentsBaseUrl?: string
  /** Droits RGPD (#70) : fourni seulement sur le profil du candidat connecté. */
  dataRights?: CandidateDataRights | null
}

export default function EmployeeProfile({
  employeeId,
  employee,
  availableSkills = [],
  notes = [],
  documents = [],
  documentsBaseUrl,
  dataRights = null,
}: EmployeeProfileProps) {
  const { url } = usePage()
  const { user } = useAuth()
  // Le conseiller voit aussi cette page (fiche candidat) : le mot de passe
  // n'est modifiable que par le candidat lui-même.
  const isOwnProfile = user?.role === USERS_ROLES.EMPLOYEE
  const backHref =
    typeof url === 'string' && url.startsWith('/dashboard/conseiller/employees/')
      ? `/dashboard/conseiller/employees/${employeeId}`
      : '/dashboard/candidat'

  if (!employee) {
    return (
      <DashboardLayout selectedEmployeeId={employeeId}>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout selectedEmployeeId={employeeId}>
      <Head title={`Profil - ${employee.name}`} />
      <div className="animate-fadeIn mx-auto space-y-10">
        <AppLink
          href={backHref}
          className="inline-flex items-center gap-2 text-brand-navy/70 hover:text-brand-navy text-sm font-medium transition-colors"
        >
          <span>←</span>
          <span>Retour à la fiche candidat</span>
        </AppLink>

        {/* Hero candidat */}
        <div className="bg-brand-navy p-10 md:p-14 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-sage/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-4xl font-bold text-brand-sage shrink-0">
              {employee.name[0]}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{employee.name}</h1>
              <p className="text-white/80 mt-2 text-lg">
                {employee.currentRole}
                {employee.targetRole && (
                  <>
                    <span className="text-white/50 mx-2">·</span>
                    <span className="text-brand-sage font-semibold">
                      Objectif {employee.targetRole}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Profil (coordonnées) */}
        <Card className="p-10 rounded-[40px]">
          <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
            Profil
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">
                Email
              </span>
              <a
                href={`mailto:${employee.email}`}
                className="text-brand-sage font-semibold hover:underline"
              >
                {employee.email}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">
                Poste actuel
              </span>
              <span className="text-brand-navy font-medium">{employee.currentRole}</span>
            </div>
            {employee.targetRole && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">
                  Objectif
                </span>
                <span className="text-brand-navy font-medium">{employee.targetRole}</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest">
                Statut
              </span>
              <span className="text-brand-navy font-medium">
                {employee.status === EMPLOYEES_STATUS.ACTIVE && 'Actif'}
                {employee.status === EMPLOYEES_STATUS.COMPLETED && 'Terminé'}
                {employee.status === EMPLOYEES_STATUS.ON_HOLD && 'En pause'}
                {employee.status === EMPLOYEES_STATUS.ARCHIVED && 'Archivé'}
                {employee.status === EMPLOYEES_STATUS.ONBOARDING && 'En onboarding'}
              </span>
            </div>
          </div>
        </Card>

        {isOwnProfile && (
          <Card className="p-10 space-y-6">
            <h2 className="text-sm font-bold text-brand-navy uppercase tracking-[0.2em]">
              Mon identité
            </h2>
            <IdentityForm employee={employee} />
          </Card>
        )}

        {employee.summary && (
          <div className="bg-brand-sage/5 p-10 rounded-[40px] border border-brand-sage/10">
            <h2 className="text-sm font-bold text-brand-sage uppercase tracking-[0.2em] mb-6">
              Bref / Résumé
            </h2>
            <p className="text-brand-navy/90 leading-relaxed whitespace-pre-wrap text-base">
              {employee.summary}
            </p>
          </div>
        )}
        <ExperiencesCard employee={employee} />

        <EducationsCard employee={employee} />
        <Skills employee={employee} availableSkills={availableSkills} />

        {documentsBaseUrl && (
          <CandidateDocuments documents={documents} baseUrl={documentsBaseUrl} />
        )}

        {isOwnProfile && (
          <Card className="p-10 space-y-6">
            <h2 className="text-sm font-bold text-brand-navy uppercase tracking-[0.2em]">
              Mot de passe
            </h2>
            <PasswordForm />
          </Card>
        )}

        {isOwnProfile && dataRights && (
          <Card className="p-10 space-y-6">
            <h2 className="text-sm font-bold text-brand-navy uppercase tracking-[0.2em]">
              Mes données
            </h2>
            <DataRights rights={dataRights} />
          </Card>
        )}

        <NotesSection
          employeeId={employee.id}
          context="general"
          title="Notes de mon conseiller"
          isAdvisor={false}
          initialNotes={notes}
        />
      </div>
    </DashboardLayout>
  )
}
