import { useId, useState, type ReactNode } from 'react'

/**
 * Libellé qui affiche sa définition dans une bulle au survol, au focus clavier ou au tap.
 * Échap ferme la bulle. Sans définition, seul le libellé est rendu (rien de focalisable).
 */
export function DefinitionTooltip({
  label,
  definition,
  className = '',
}: {
  label: ReactNode
  definition?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  if (!definition) return <span className={className}>{label}</span>

  return (
    <span className="relative inline-block">
      <span
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className={`cursor-help underline decoration-hairline-strong decoration-dotted underline-offset-4 outline-none hover:decoration-accent focus-visible:text-accent focus-visible:decoration-accent ${className}`}
      >
        {label}
      </span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 z-30 mb-2 block w-64 max-w-[80vw] rounded-lg bg-ink px-3 py-2 text-left text-sm font-normal leading-snug text-on-primary shadow-raised"
        >
          {definition}
        </span>
      )}
    </span>
  )
}
