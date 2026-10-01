import { APP_NAME } from '#shared/constants/app'
import { memo } from 'react'
import logoMark from '~/assets/images/logo-mark.png'

export type LogoSize = 'sm' | 'md' | 'lg'
export type LogoTone = 'default' | 'inverse'

export interface LogoProps {
  size?: LogoSize
  className?: string
  showText?: boolean
  /** `inverse` : wordmark blanc, pour les surfaces ink (footer, bande CTA). */
  tone?: LogoTone
}

const MARK_SIZE: Record<LogoSize, number> = { sm: 24, md: 32, lg: 40 }
const TEXT_CLASS: Record<LogoSize, string> = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }

/** Mark du logo (`inertia/assets/images/logo-mark.png`) + wordmark `APP_NAME` en texte. */
export const Logo = memo(function Logo({
  size = 'md',
  className = '',
  showText = true,
  tone = 'default',
}: LogoProps) {
  const mark = MARK_SIZE[size]
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
      role="img"
      aria-label={APP_NAME}
    >
      <img
        src={logoMark}
        alt=""
        width={mark}
        height={mark}
        className="shrink-0"
        aria-hidden="true"
      />
      {showText && (
        <span
          className={`font-display font-bold tracking-tight leading-none ${TEXT_CLASS[size]} ${
            tone === 'inverse' ? 'text-on-ink' : 'text-ink'
          }`}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  )
})

Logo.displayName = 'Logo'

export default Logo
