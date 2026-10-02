/**
 * Prix TTC lisible (« 49 € », « 49,90 € ») à partir de centimes. Format
 * français, sans décimales quand le montant est rond.
 */
export function formatPrice(cents: number, currency: string = 'eur'): string {
  const amount = cents / 100
  const hasCents = !Number.isInteger(amount)
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
