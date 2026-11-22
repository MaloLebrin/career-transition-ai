import React, { useId } from 'react'
import { GALET_PATH, GALET_VIEWBOX } from '~/components/ui/logo/logo_geometry'

export interface GaletPortraitProps {
  /** Prénom : nom accessible du portrait et initiale de la pastille. */
  name: string
  /** Photo carrée (800 × 800 minimum, visage centré) ; absente, la couleur de secours. */
  photoUrl?: string | null
  /** Fond de secours tant que la photo manque (classe `fill-*`). */
  fallbackClassName: string
  /** Pastille de l'initiale (classe `bg-*`). */
  badgeClassName: string
}

/**
 * Portrait découpé dans le galet du logo (même tracé, `clipPath`), 200 × 183 px sur mobile,
 * 260 × 238 px dès `sm`. Une pastille ronde 44 px bordée de blanc porte l'initiale.
 */
export const GaletPortrait: React.FC<GaletPortraitProps> = ({
  name,
  photoUrl,
  fallbackClassName,
  badgeClassName,
}) => {
  const clipId = useId()
  const { width, height } = GALET_VIEWBOX
  return (
    <div className="relative h-[183px] w-[200px] sm:h-[238px] sm:w-[260px]">
      <svg
        role="img"
        aria-label={photoUrl ? `Portrait de ${name}` : `Portrait de ${name}, photo à venir`}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={GALET_PATH} />
          </clipPath>
        </defs>
        <path d={GALET_PATH} className={fallbackClassName} />
        {photoUrl && (
          <image
            href={photoUrl}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className={`absolute right-1.5 bottom-2.5 flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold text-on-ink ring-4 ring-surface ${badgeClassName}`}
      >
        {name.charAt(0)}
      </span>
    </div>
  )
}
