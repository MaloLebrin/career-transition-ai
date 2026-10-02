import { usePage } from '@inertiajs/react'
import type { BillingInfo } from '#shared/types/billing/billing'

/** Prop partagée `billing` (#101) : prix du forfait et activation du paiement. */
export function useBilling(): BillingInfo | null {
  const { props } = usePage<{ billing?: BillingInfo | null }>()
  return props.billing ?? null
}
