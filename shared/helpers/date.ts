/**
 * Format a date string to a short month and year format (e.g. "janv. 2022")
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}
