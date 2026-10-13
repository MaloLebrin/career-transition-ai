import {
  ORGANIZATION_MEMBER_PATHS,
  ORGANIZATION_TEAM_ROLES,
  TEAM_ROLE_LABELS,
  type OrganizationTeamRole,
} from '#shared/constants/organisation'
import type { Advisor } from '#shared/types/advisor/roles'
import { router } from '@inertiajs/react'
import { useState } from 'react'
import Badge from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'
import SelectField from '~/components/ui/SelectField'

interface TeamMemberProps {
  member: Advisor
  isMe?: boolean
  /** Administrateur du cabinet : rôle, accès et réassignation. */
  canManage?: boolean
  /** Autres membres actifs, destinataires possibles d'une réassignation. */
  colleagues?: Advisor[]
}

const roleOptions = ORGANIZATION_TEAM_ROLES.map((role) => ({
  value: role,
  label: TEAM_ROLE_LABELS[role] ?? role,
}))

/** Un membre de l'équipe du cabinet et, pour l'administrateur, ses actions (#71). */
export const TeamMember = ({
  member,
  isMe = false,
  canManage = false,
  colleagues = [],
}: TeamMemberProps) => {
  const [confirmingDisable, setConfirmingDisable] = useState(false)
  const [reassignTo, setReassignTo] = useState('')
  const disabled = Boolean(member.disabledAt)
  const manageable = canManage && !isMe
  const editableRole = (ORGANIZATION_TEAM_ROLES as readonly string[]).includes(member.role)
  const targets = colleagues.filter((c) => c.id !== member.id)

  return (
    <div className="p-4 bg-surface-soft border border-hairline rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-muted font-bold text-sm border border-hairline">
            {member.name[0]}
          </div>
          <div>
            <div className="text-sm font-semibold text-ink flex flex-wrap items-center gap-2">
              {member.name}
              {isMe && <Badge variant="neutral">Moi</Badge>}
              <Badge variant="info">{TEAM_ROLE_LABELS[member.role] ?? 'Inconnu'}</Badge>
              {disabled && <Badge variant="warning">Accès retiré</Badge>}
            </div>
            <div className="text-xs text-muted">{member.email}</div>
          </div>
        </div>
        {manageable && (
          <div className="flex items-center gap-2">
            {editableRole && !disabled && (
              <SelectField<OrganizationTeamRole>
                aria-label={`Rôle de ${member.name}`}
                options={roleOptions}
                value={member.role as OrganizationTeamRole}
                onChange={(role) =>
                  router.put(
                    ORGANIZATION_MEMBER_PATHS.role(member.id),
                    { role },
                    { preserveScroll: true }
                  )
                }
              />
            )}
            {disabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.post(
                    ORGANIZATION_MEMBER_PATHS.enable(member.id),
                    {},
                    { preserveScroll: true }
                  )
                }
              >
                Rétablir l’accès
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmingDisable(true)}>
                Retirer l’accès
              </Button>
            )}
          </div>
        )}
      </div>

      {manageable && targets.length > 0 && (
        <div className="flex items-center gap-2">
          <SelectField
            aria-label={`Réassigner les candidats de ${member.name} à`}
            options={[
              { value: '', label: 'Réassigner ses candidats à…' },
              ...targets.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={reassignTo}
            onChange={setReassignTo}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={reassignTo === ''}
            onClick={() =>
              router.post(
                ORGANIZATION_MEMBER_PATHS.reassign(member.id),
                { toUserId: Number(reassignTo) },
                { preserveScroll: true, onSuccess: () => setReassignTo('') }
              )
            }
          >
            Réassigner
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmingDisable}
        variant="warning"
        title="Retirer l’accès ?"
        description={`${member.name} ne pourra plus se connecter et sa session en cours sera coupée. Ses données et ses candidats sont conservés : pensez à les réassigner. L’accès peut être rétabli.`}
        confirmLabel="Retirer l’accès"
        onCancel={() => setConfirmingDisable(false)}
        onConfirm={() =>
          router.post(
            ORGANIZATION_MEMBER_PATHS.disable(member.id),
            {},
            { preserveScroll: true, onFinish: () => setConfirmingDisable(false) }
          )
        }
      />
    </div>
  )
}
