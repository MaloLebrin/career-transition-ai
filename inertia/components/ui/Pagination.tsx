import Button from '~/components/ui/Button'

interface PaginationProps {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
}

/** Navigation Précédent / Suivant d'une liste paginée ; rien à afficher pour une seule page. */
export function Pagination({ page, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  return (
    <nav className="flex items-center justify-between" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted">
        Page {page} / {lastPage}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  )
}
