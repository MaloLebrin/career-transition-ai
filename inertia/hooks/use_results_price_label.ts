import { BILLING_CURRENCY, DEFAULT_RESULTS_PRICE_CENTS } from '#shared/constants/billing'
import { formatPrice } from '#shared/helpers/billing/format_price'
import { useBilling } from '~/hooks/use_billing'

/** Prix du forfait : prop partagée `billing` si présente, sinon le défaut de l'application. */
export function useResultsPriceLabel(): string {
  const billing = useBilling()
  return formatPrice(
    billing?.resultsPriceCents ?? DEFAULT_RESULTS_PRICE_CENTS,
    billing?.currency ?? BILLING_CURRENCY
  )
}
