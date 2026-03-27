import { memo } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps {
  size?: LogoSize
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
const Logo = memo(function Logo({ size = 'md', className = '' }: LogoProps) {
  const height = HEIGHT_MAP[size]

  return (
    <div
      className={`inline-flex items-center bg-transparent gap-2 ${className}`.trim()}
      style={{ height }}
      role="img"
      aria-label={BRAND_NAME}
    >
      <img src="~/assets/images/logo.png" alt="Logo France Transition Carrière" className="w-full h-full" />
    </div>
  )
})

Logo.displayName = 'Logo'

export default Logo
