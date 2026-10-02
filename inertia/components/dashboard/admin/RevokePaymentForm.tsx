import { useForm } from '@inertiajs/react'
import { BILLING_ADMIN_PATHS, REVOKE_REASON_MAX } from '#shared/constants/billing'
import Button from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'

interface RevokePaymentFormProps {
  paymentId: number
  onCancel: () => void
}

/** Révocation d'un accès (#107) : motif consigné sur le paiement, particulier prévenu. */
export function RevokePaymentForm({ paymentId, onCancel }: RevokePaymentFormProps) {
  const { data, setData, post, processing, errors } = useForm({ reason: '' })

  return (
    <form
      className="space-y-3"
      aria-label="Retirer l’accès"
      onSubmit={(event) => {
        event.preventDefault()
        post(BILLING_ADMIN_PATHS.revoke(paymentId), { preserveScroll: true })
      }}
    >
      <Textarea
        label="Motif du retrait"
        name="reason"
        required
        rows={2}
        maxLength={REVOKE_REASON_MAX}
        value={data.reason}
        onChange={(e) => setData('reason', e.target.value)}
        error={errors.reason}
        hint="Consigné sur le paiement (usage interne). Un remboursement se fait dans Stripe : le webhook retire l’accès."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" size="sm" isLoading={processing}>
          Confirmer le retrait
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
