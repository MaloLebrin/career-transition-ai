import { usePage } from '@inertiajs/react'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'

/**
 * Droits d'accès aux résultats du candidat connecté (prop partagée
 * `entitlement`, #94). `null` hors espace candidat. Le front n'en déduit que
 * l'affichage : le verrouillage réel reste côté serveur.
 */
export function useEntitlement(): ResultsEntitlement | null {
  const { props } = usePage<{ entitlement?: ResultsEntitlement | null }>()
  return props.entitlement ?? null
}
