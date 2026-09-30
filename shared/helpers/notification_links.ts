/**
 * Lien interne d'une notification (`meta.href`, #70), ou `null`.
 * Seuls les chemins du tableau de bord sont suivis : jamais d'URL externe ni
 * de chemin relatif au protocole (`//hote`) venus de la base.
 */
export function notificationHref(meta: Record<string, unknown> | null | undefined): string | null {
  const href = meta?.href
  if (typeof href !== 'string') return null
  if (!href.startsWith('/dashboard/') || href.startsWith('//')) return null
  return href
}
