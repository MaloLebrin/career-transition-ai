import { router } from '@inertiajs/react'
import { useState } from 'react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { ROLE_LABELS } from '#shared/helpers/roles'
import type { ContactRequestItem } from '#shared/types/contact_request/admin'
import Badge from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'

interface ContactRequestSenderActionsProps {
  request: ContactRequestItem
}

type PendingAction = 'block' | 'disable' | null

const RELOAD = { preserveScroll: true, only: ['requests'] }

/**
 * Blocage de l'expéditeur d'une demande : son adresse pour le formulaire public et, s'il en
 * existe un, le compte qui porte cette adresse.
 */
export function ContactRequestSenderActions({ request }: ContactRequestSenderActionsProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [submitting, setSubmitting] = useState(false)
  const { account, ambiguousAccount, senderBlocked } = request

  const post = (path: string) => {
    if (submitting) return
    setSubmitting(true)
    router.post(
      path,
      {},
      {
        ...RELOAD,
        onFinish: () => {
          setSubmitting(false)
          setPending(null)
        },
      }
    )
  }

  const confirm = () =>
    post(
      pending === 'disable'
        ? SUPER_ADMIN_PATHS.contactRequestDisableAccount(request.id)
        : SUPER_ADMIN_PATHS.contactRequestBlockSender(request.id)
    )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {senderBlocked && <Badge variant="danger">Expéditeur bloqué</Badge>}
          {account ? (
            <>
              <span>
                Compte : {account.name} · {ROLE_LABELS[account.role]}
              </span>
              {account.disabled && <Badge variant="warning">Compte désactivé</Badge>}
            </>
          ) : ambiguousAccount ? (
            <span>
              Plusieurs comptes portent cette adresse : gérez-les depuis la page des comptes
            </span>
          ) : (
            <span>Aucun compte avec cette adresse</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {senderBlocked ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => post(SUPER_ADMIN_PATHS.contactRequestUnblockSender(request.id))}
            >
              Débloquer l’expéditeur
            </Button>
          ) : (
            <Button type="button" size="xs" variant="outline" onClick={() => setPending('block')}>
              Bloquer l’expéditeur
            </Button>
          )}
          {account?.canDisable &&
            (account.disabled ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => post(SUPER_ADMIN_PATHS.contactRequestEnableAccount(request.id))}
              >
                Réactiver le compte
              </Button>
            ) : (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setPending('disable')}
              >
                Désactiver le compte
              </Button>
            ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={pending !== null}
        variant="warning"
        title={pending === 'disable' ? 'Désactiver ce compte ?' : 'Bloquer cet expéditeur ?'}
        description={
          pending === 'disable'
            ? `${account?.name ?? request.name} ne pourra plus se connecter et sa session en cours sera coupée. Ses données sont conservées et le compte peut être réactivé.`
            : `Les prochaines demandes envoyées depuis ${request.email} seront ignorées, sans que l’expéditeur en soit averti. Ses demandes encore à traiter seront archivées.`
        }
        confirmLabel={pending === 'disable' ? 'Désactiver' : 'Bloquer'}
        state={submitting ? 'loading' : 'idle'}
        onCancel={() => !submitting && setPending(null)}
        onConfirm={confirm}
      />
    </>
  )
}
