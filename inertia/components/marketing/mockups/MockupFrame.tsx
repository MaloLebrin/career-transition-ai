import React from 'react'

export interface MockupFrameProps {
  /** Titre affiché dans la barre de fenêtre. */
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * Fenêtre d'application stylisée autour d'un mockup vivant, avec la mention « Aperçu
 * illustratif » (DESIGN.md §1 : une maquette ne prétend pas être le produit).
 */
export const MockupFrame = React.forwardRef<HTMLDivElement, MockupFrameProps>(
  ({ title, children, className = '' }, ref) => (
    <figure
      ref={ref}
      className={`overflow-hidden rounded-2xl border border-hairline bg-surface shadow-floating ${className}`.trim()}
    >
      <div
        className="flex items-center gap-3 border-b border-hairline bg-surface-soft px-4 py-3"
        aria-hidden="true"
      >
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-tint-apricot-bold" />
          <span className="h-2.5 w-2.5 rounded-full bg-tint-sun-bold" />
          <span className="h-2.5 w-2.5 rounded-full bg-tint-meadow-bold" />
        </span>
        <span className="truncate text-caption text-muted">{title}</span>
      </div>
      <div className="p-5" aria-hidden="true">
        {children}
      </div>
      <figcaption className="border-t border-hairline px-5 py-2 text-caption text-muted">
        Aperçu illustratif
      </figcaption>
    </figure>
  )
)
MockupFrame.displayName = 'MockupFrame'
