import { Head } from '@inertiajs/react'
import { ROLE_LABELS } from '#shared/helpers/roles'
import type { PlatformTeamMember } from '#shared/types/expert_request/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { InvitePlatformMemberForm } from '~/components/dashboard/admin/InvitePlatformMemberForm'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'

interface TeamAdminProps {
  members: PlatformTeamMember[]
}

/** Back-office super admin : équipe interne de la plateforme (#105). */
export default function TeamAdmin({ members }: TeamAdminProps) {
  return (
    <>
      <Head title="Équipe interne" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h1 className="font-display text-display-sm text-ink">Équipe interne</h1>
            <p className="text-sm text-muted">
              Les experts de la plateforme accompagnent les particuliers qui en font la demande.
            </p>
          </div>

          <InvitePlatformMemberForm />

          {members.length === 0 ? (
            <Card variant="flat" role="status">
              <p className="text-sm text-muted">Aucun membre pour le moment.</p>
            </Card>
          ) : (
            <Card padding="none">
              <table className="w-full text-sm" aria-label="Membres de l’équipe interne">
                <thead>
                  <tr className="border-b border-hairline text-left text-muted">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Membre
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Rôle
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Candidats suivis
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Compte
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-hairline last:border-b-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-ink">{member.name}</div>
                        <div className="text-muted">{member.email}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{ROLE_LABELS[member.role]}</td>
                      <td className="px-5 py-3 text-ink-soft">{member.assignedCandidatesCount}</td>
                      <td className="px-5 py-3">
                        <Badge variant={member.onboardingCompleted ? 'success' : 'warning'} dot>
                          {member.onboardingCompleted ? 'Activé' : 'Invitation envoyée'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
