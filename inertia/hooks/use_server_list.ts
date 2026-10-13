import { listQuery } from '#shared/helpers/pagination'
import { router } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Délai avant d'envoyer la recherche saisie au serveur. */
export const SEARCH_DEBOUNCE_MS = 300

type FilterValues = Record<string, string>

/**
 * Liste paginée et filtrée côté serveur (issue #75) : la saisie met à jour l'état local tout de
 * suite, la recherche part au serveur après `SEARCH_DEBOUNCE_MS` (page 1), les autres filtres
 * partent immédiatement, et `goToPage` garde les filtres. Navigation Inertia partielle
 * (`only`) : l'URL reste partageable (`?page=&search=&…`) sans recharger la page entière.
 */
export function useServerList<F extends FilterValues>(path: string, initial: F, only: string[]) {
  const [values, setValues] = useState<F>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(values)
  latest.current = values

  const visit = useCallback(
    (next: F, page = 1) => {
      router.get(path, listQuery({ ...next, page }), {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: [...only, 'pagination', 'filters'],
      })
    },
    [path, only]
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const schedule = useCallback(
    (key: keyof F, value: string, debounced: boolean) => {
      const next = { ...latest.current, [key]: value }
      latest.current = next
      setValues(next)
      if (timer.current) clearTimeout(timer.current)
      if (debounced) timer.current = setTimeout(() => visit(next), SEARCH_DEBOUNCE_MS)
      else visit(next)
    },
    [visit]
  )

  /** Saisie libre : champ mis à jour tout de suite, requête après le délai. */
  const setSearch = useCallback((search: string) => schedule('search', search, true), [schedule])

  /** Autre filtre : requête immédiate, ou après le délai pour un champ texte (`debounced`). */
  const setFilter = useCallback(
    (key: Exclude<keyof F, 'search'>, value: string, debounced = false) =>
      schedule(key, value, debounced),
    [schedule]
  )

  const goToPage = useCallback((page: number) => visit(latest.current, page), [visit])

  return { values, setSearch, setFilter, goToPage }
}
