/** Méta d'une page de liste, renvoyée en prop Inertia `pagination` (`#utils/pagination`). */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  lastPage: number
}

/** Paramètres communs d'une liste paginée avec recherche (query string `?page=&search=`). */
export interface ListParams {
  page: number
  search: string
}

/** Une page d'éléments et sa méta. */
export interface Paginated<T> {
  items: T[]
  pagination: PaginationMeta
}
