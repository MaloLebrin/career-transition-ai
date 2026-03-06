import React, { memo } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps {
  size?: LogoSize
  /**
   * Quand true: logo avec texte "France Transition Carrière".
   * Quand false: icône seule (utilisée dans certains blocs UI).
   */
  showText?: boolean
  className?: string
}

const HEIGHT_MAP: Record<LogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 52,
}

const BRAND_NAME = 'France Transition Carrière'

/**
 * Logo de l'application. Pour utiliser des images à la place, ajoute
 * logo-with-name.png et logo-without-name.png dans inertia/assets/images/
 * et réactive les imports + balises <img>.
 */
const Logo = memo(function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const height = HEIGHT_MAP[size]

  return (
    <div
      className={`inline-flex items-center bg-transparent gap-2 ${className}`.trim()}
      style={{ height }}
      role="img"
      aria-label={BRAND_NAME}
    >
      <span
        className="flex items-center justify-center rounded bg-brand-navy text-white font-bold shrink-0"
        style={{ width: height, height, fontSize: Math.round(height * 0.45) }}
        aria-hidden
      >
        FTC
      </span>
      {showText && (
        <span
          className="text-brand-navy font-bold tracking-tight whitespace-nowrap"
          style={{ fontSize: Math.round(height * 0.5) }}
        >
          {BRAND_NAME}
        </span>
      )}
    </div>
  )
})

Logo.displayName = 'Logo'

export default Logo
