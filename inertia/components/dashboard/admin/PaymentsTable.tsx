import { Fragment, useState } from 'react'
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import { formatPrice } from '#shared/helpers/billing/format_price'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { PaymentRow } from '#shared/types/billing/admin'
import { RevokePaymentForm } from '~/components/dashboard/admin/RevokePaymentForm'
import Badge, { type BadgeVariant } from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'

const TONE_BY_STATUS: Record<PaymentRow['status'], BadgeVariant> = {
  [PAYMENT_STATUSES.PENDING]: 'warning',
  [PAYMENT_STATUSES.PAID]: 'success',
  [PAYMENT_STATUSES.FAILED]: 'danger',
  [PAYMENT_STATUSES.CANCELED]: 'neutral',
  [PAYMENT_STATUSES.REFUNDED]: 'neutral',
}

interface PaymentsTableProps {
  payments: PaymentRow[]
}

/** Paiements du forfait (#107) : statut, origine, droit ouvert, retrait d'un accès. */
export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [revoking, setRevoking] = useState<number | null>(null)

  if (payments.length === 0) {
    return (
      <Card variant="flat" role="status">
        <p className="text-sm text-muted">Aucun paiement pour ce filtre.</p>
      </Card>
    )
  }

  return (
    <Card padding="none">
      <table className="w-full text-sm" aria-label="Paiements du forfait">
        <thead>
          <tr className="border-b border-hairline text-left text-muted">
            <th scope="col" className="px-5 py-3 font-medium">
              Particulier
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Montant
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Statut
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Dates
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <Fragment key={payment.id}>
              <tr className="border-b border-hairline last:border-b-0">
                <td className="px-5 py-3">
                  {payment.candidate ? (
                    <>
                      <div className="font-medium text-ink">{payment.candidate.name}</div>
                      <div className="text-muted">{payment.candidate.email}</div>
                    </>
                  ) : (
                    <span className="text-muted">Compte supprimé (pièce comptable conservée)</span>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {formatPrice(payment.amountCents, payment.currency)}
                  <div className="text-muted">
                    {payment.provider === PAYMENT_PROVIDERS.MANUAL
                      ? `Octroi manuel${payment.grantedBy ? ` · ${payment.grantedBy.name}` : ''}`
                      : 'Stripe'}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={TONE_BY_STATUS[payment.status]} dot>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                    {payment.revokedAt && payment.status === PAYMENT_STATUSES.PAID && (
                      <Badge variant="danger">Accès retiré</Badge>
                    )}
                  </div>
                  {payment.revokeReason && (
                    <div className="mt-1 text-muted">{payment.revokeReason}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {payment.paidAt && <div>Payé le {formatDateTimeFR(payment.paidAt)}</div>}
                  {payment.refundedAt && (
                    <div>Remboursé le {formatDateTimeFR(payment.refundedAt)}</div>
                  )}
                  {payment.revokedAt && <div>Retiré le {formatDateTimeFR(payment.revokedAt)}</div>}
                  {!payment.paidAt && payment.createdAt && (
                    <div>Créé le {formatDateTimeFR(payment.createdAt)}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {payment.grantsAccess && revoking !== payment.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevoking(payment.id)}
                    >
                      Retirer l’accès
                    </Button>
                  )}
                </td>
              </tr>
              {revoking === payment.id && (
                <tr className="border-b border-hairline last:border-b-0 bg-surface-soft">
                  <td colSpan={5} className="px-5 py-4">
                    <RevokePaymentForm paymentId={payment.id} onCancel={() => setRevoking(null)} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
