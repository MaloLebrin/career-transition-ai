type ExerciseSaveOverlayProps = {
  open: boolean
}

/**
 * Indicateur pendant l'enregistrement du résultat.
 * Les clics passent au travers : l'analyse IA continue après la redirection.
 */
export function ExerciseSaveOverlay({ open }: ExerciseSaveOverlayProps) {
  if (!open) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95"
      role="status"
    >
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-hairline-strong border-t-transparent" />
      <p className="text-center text-xl font-bold text-ink">
        Enregistrement…
        <br />
        <span className="text-sm font-medium text-muted">
          L’analyse se prépare en arrière-plan. Vous pouvez continuer.
        </span>
      </p>
    </div>
  )
}
