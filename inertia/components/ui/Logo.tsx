import { APP_NAME } from '#shared/constants/app'
import { memo } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps {
  size?: LogoSize
  className?: string
  showText?: boolean
}

const HEIGHT_MAP: Record<LogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 52,
}

const BRAND_NAME = APP_NAME

/**
 * Logo de l'application. Pour utiliser des images à la place, ajoute
 * logo-with-name.png et logo-without-name.png dans inertia/assets/images/
 * et réactive les imports + balises <img>.
 */
export const Logo = memo(function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const height = HEIGHT_MAP[size]
  const markSize = Math.round(height * 0.9)

  return (
    <div
      className={`inline-flex items-center bg-transparent gap-2 ${className}`.trim()}
      style={{ height }}
      role="img"
      aria-label={BRAND_NAME}
    >
      <div
        className="shrink-0 rounded-2xl bg-brand-sage/15 border border-brand-sage/25 flex items-center justify-center text-brand-sage font-black tracking-tight"
        style={{ width: markSize, height: markSize }}
        aria-hidden="true"
      >
        FTC
      </div>
      {showText && (
        <div className="leading-none">
          <div className="text-sm font-black text-slate-900">{APP_NAME}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {/* Intentionnellement laissé vide: le nom complet est géré via APP_NAME */}
          </div>
        </div>
      )}
    </div>
  )
})

Logo.displayName = 'Logo'
