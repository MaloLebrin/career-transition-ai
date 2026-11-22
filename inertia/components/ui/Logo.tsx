import { APP_NAME } from '#shared/constants/app'
import { memo } from 'react'
import { LogoBadge } from './logo/LogoBadge'
import { LogoMark } from './logo/LogoMark'

export type LogoSize = 'sm' | 'md' | 'lg'
export type LogoTone = 'default' | 'inverse'

export interface LogoProps {
  size?: LogoSize
  className?: string
  showText?: boolean
  /** `inverse` : wordmark et plongeoir clairs, pour les surfaces ink (footer, bande CTA). */
  tone?: LogoTone
}

/** Hauteur de la marque : `sm` (≤ 32 px) passe à la pastille ronde, illisible en dessous. */
const MARK_HEIGHT: Record<LogoSize, number> = { sm: 28, md: 44, lg: 52 }
const TEXT_CLASS: Record<LogoSize, string> = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

/** Le nom s'écrit jumpUjob, le U toujours en corail. */
const WORDMARK = { before: 'jump', accent: 'U', after: 'job' } as const

/**
 * Logo jumpUjob : marque SVG inline (galet sur plongeoir, ou pastille en `sm`) + wordmark.
 * Le nom accessible est `APP_NAME` ; le wordmark visuel est masqué aux lecteurs d'écran.
 */
export const Logo = memo(function Logo({
  size = 'md',
  className = '',
  showText = true,
  tone = 'default',
}: LogoProps) {
  const height = MARK_HEIGHT[size]
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
      role="img"
      aria-label={APP_NAME}
    >
      {size === 'sm' ? <LogoBadge size={height} /> : <LogoMark height={height} tone={tone} />}
      {showText && (
        <span
          aria-hidden="true"
          data-testid="logo-wordmark"
          className={`font-display font-extrabold tracking-[-0.03em] leading-none ${TEXT_CLASS[size]} ${
            tone === 'inverse' ? 'text-on-ink' : 'text-ink'
          }`}
        >
          {WORDMARK.before}
          <span className="text-coral">{WORDMARK.accent}</span>
          {WORDMARK.after}
        </span>
      )}
    </span>
  )
})

Logo.displayName = 'Logo'

export default Logo
