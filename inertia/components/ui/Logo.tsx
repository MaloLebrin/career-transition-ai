import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  /**
   * Quand true: logo avec texte "France Transition Carrière".
   * Quand false: icône seule (utilisée dans certains blocs UI).
   */
  showText?: boolean
}

const heightMap: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 40,
  lg: 52,
}

/**
 * Logo de l’application. Pour utiliser des images à la place, ajoute
 * logo-with-name.png et logo-without-name.png dans inertia/assets/images/
 * et réactive les imports + balises <img>.
 */
const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const height = heightMap[size]
  const alt = 'France Transition Carrière'

  return (
    <div
      className="inline-flex items-center bg-transparent gap-2"
      style={{ height }}
      aria-label={alt}
    >
      <span
        className="flex items-center justify-center rounded bg-brand-navy text-white font-bold shrink-0"
        style={{ width: height, height, fontSize: Math.round(height * 0.45) }}
      >
        FTC
      </span>
      {showText && (
        <span className="text-brand-navy font-bold tracking-tight whitespace-nowrap" style={{ fontSize: Math.round(height * 0.5) }}>
          France Transition Carrière
        </span>
      )}
    </div>
  )
}

export default Logo

