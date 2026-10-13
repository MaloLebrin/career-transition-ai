import { router } from '@inertiajs/react'
import { useState } from 'react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { UserListItem } from '#shared/types/super_admin/lists'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'

interface UserRowActionsProps {
  user: UserListItem
  /** Compte connecté : on ne peut ni se désactiver ni se supprimer soi-même. */
  currentUserId: number | null
  onEdit: (user: UserListItem) => void
}

type PendingAction = 'disable' | 'delete' | null

/** Modifier, désactiver / réactiver et supprimer un utilisateur depuis la liste (#73). */
export function UserRowActions({ user, currentUserId, onEdit }: UserRowActionsProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [submitting, setSubmitting] = useState(false)
  const locked = user.id === currentUserId || user.role === USERS_ROLES.SUPER_ADMIN
  const disabled = user.disabledAt !== null

  const run = (visit: (options: { onFinish: () => void }) => void) => {
    if (submitting) return
    setSubmitting(true)
    visit({
      onFinish: () => {
        setSubmitting(false)
        setPending(null)
      },
    })
  }

  const enable = () =>
    run((options) =>
      router.post(SUPER_ADMIN_PATHS.userEnable(user.id), {}, { preserveScroll: true, ...options })
    )
  const confirm = () =>
    run((options) =>
      pending === 'delete'
        ? router.delete(SUPER_ADMIN_PATHS.user(user.id), { preserveScroll: true, ...options })
        : router.post(
            SUPER_ADMIN_PATHS.userDisable(user.id),
            {},
            { preserveScroll: true, ...options }
          )
    )

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="xs" variant="outline" onClick={() => onEdit(user)}>
          Modifier
        </Button>
        {!locked &&
          (disabled ? (
            <Button type="button" size="xs" variant="outline" onClick={enable}>
              Réactiver
            </Button>
          ) : (
            <Button type="button" size="xs" variant="outline" onClick={() => setPending('disable')}>
              Désactiver
            </Button>
          ))}
        {!locked && (
          <Button type="button" size="xs" variant="ghost" onClick={() => setPending('delete')}>
            Supprimer
          </Button>
        )}
      </div>

      <ConfirmModal
        isOpen={pending !== null}
        variant={pending === 'delete' ? 'danger' : 'warning'}
        title={pending === 'delete' ? 'Supprimer ce compte ?' : 'Désactiver ce compte ?'}
        description={
          pending === 'delete'
            ? `${user.name} (${user.email}) sera supprimé définitivement. Si des données lui sont rattachées, la suppression sera refusée : désactivez alors le compte.`
            : `${user.name} ne pourra plus se connecter et sa session en cours sera coupée. Ses données sont conservées et le compte peut être réactivé.`
        }
        confirmLabel={pending === 'delete' ? 'Supprimer' : 'Désactiver'}
        state={submitting ? 'loading' : 'idle'}
        onCancel={() => !submitting && setPending(null)}
        onConfirm={confirm}
      />
    </>
  )
}
