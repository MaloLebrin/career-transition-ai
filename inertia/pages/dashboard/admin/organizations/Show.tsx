import { Head } from '@inertiajs/react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { formatDateTimeFR } from '#shared/helpers/date'
import { ROLE_LABELS } from '#shared/helpers/roles'
import type { OrganizationDetail } from '#shared/types/super_admin/lists'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { OrganizationEditForm } from '~/components/dashboard/admin/OrganizationEditForm'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'
import StatCard from '~/components/ui/StatCard'

interface OrganizationShowProps {
  organization: OrganizationDetail
}

/** Fiche d'une organisation cliente : informations modifiables, compteurs et membres (#73). */
export default function OrganizationShow({ organization }: OrganizationShowProps) {
  return (
    <>
      <Head title={organization.name} />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <AppLink
              href={SUPER_ADMIN_PATHS.organizations}
              className="text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              ← Organisations
            </AppLink>
            <h1 className="font-display text-display-sm text-ink">{organization.name}</h1>
            <p className="text-sm text-muted">
              Créée le {organization.createdAt ? formatDateTimeFR(organization.createdAt) : '—'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <StatCard label="Utilisateurs" value={organization.usersCount} color="sage" />
            <StatCard label="Candidats" value={organization.employeesCount} color="terracotta" />
          </div>

          <OrganizationEditForm organization={organization} />

          <Card padding="none">
            <table className="w-full text-sm" aria-label="Membres de l’organisation">
              <thead>
                <tr className="border-b border-hairline text-left text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Membre
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Rôle
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Accès
                  </th>
                </tr>
              </thead>
              <tbody>
                {organization.members.map((member) => (
                  <tr key={member.id} className="border-b border-hairline last:border-b-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{member.name}</div>
                      <div className="text-muted">{member.email}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{ROLE_LABELS[member.role]}</td>
                    <td className="px-5 py-3">
                      {member.disabledAt ? (
                        <Badge variant="danger">Désactivé</Badge>
                      ) : (
                        <Badge variant={member.onboardingCompleted ? 'success' : 'warning'}>
                          {member.onboardingCompleted ? 'Actif' : 'En attente'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {organization.members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-muted">
                      Aucun membre pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </DashboardLayout>
    </>
  )
}
