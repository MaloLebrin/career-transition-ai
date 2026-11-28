/**
 * Fuseau d'affichage des dates : celui de l'application (`TZ` du serveur).
 * Sans lui, une date de calendrier sérialisée à minuit heure de Paris
 * (`2024-06-02T00:00:00+02:00`) s'affiche la veille dans un navigateur à
 * l'ouest de Paris.
 */
export const APP_TIME_ZONE = 'Europe/Paris'

/**
 * Format a date string to a short month and year format (e.g. "janv. 2022")
 */
export function formatDate(
  dateStr: string | undefined,
  options?: { day?: 'numeric'; month: 'short' | 'long'; year: 'numeric' }
): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { ...options, timeZone: APP_TIME_ZONE })
}

export function formatSessionDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  })
}

/**
 * Durée d'un exercice, stockée en secondes (`exercise_results.duration`),
 * en texte lisible : « 45 s », « 2 min », « 11 min 20 s ».
 */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  if (mins === 0) return `${secs} s`
  return secs === 0 ? `${mins} min` : `${mins} min ${secs} s`
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export function formatDateTimeFR(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  })
}
