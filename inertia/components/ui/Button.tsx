import React, { forwardRef, memo } from 'react'

/**
 * Variantes du design system (DESIGN.md) :
 * - `primary`   : l'action principale, encre (bleu nuit).
 * - `secondary` : le bouton soleil (jaune, texte encre) — CTA secondaire, et le seul
 *                 bouton plein lisible sur une surface ink (ancien `emphasis`, ancien `cta`).
 * - `outline`   : action secondaire discrète, bordure hairline.
 * - `ghost`     : action discrète, sans fond.
 * - `danger`    : action destructive.
 *
 * `emphasis`, `cta` et `xs` sont conservés comme alias dépréciés pour le dashboard
 * (phase 2 de la refonte) : ils se rendent comme `secondary`, `secondary` et `sm`.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  /** @deprecated utiliser `secondary` */
  | 'emphasis'
  /** @deprecated utiliser `secondary` */
  | 'cta'

export type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg'
  /** @deprecated utiliser `sm` */
  | 'xs'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: React.ReactNode
}

type ResolvedButtonVariant = Exclude<ButtonVariant, 'emphasis' | 'cta'>

const VARIANTS: Record<ResolvedButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-pressed',
  secondary: 'bg-sun text-ink hover:bg-sun-pressed',
  outline: 'bg-surface border border-hairline-strong text-ink hover:bg-surface-soft',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-soft hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
}

const SIZES: Record<Exclude<ButtonSize, 'xs'>, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const BASE_STYLES =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed'

function resolveVariant(variant: ButtonVariant): ResolvedButtonVariant {
  return variant === 'emphasis' || variant === 'cta' ? 'secondary' : variant
}

function resolveSize(size: ButtonSize): Exclude<ButtonSize, 'xs'> {
  return size === 'xs' ? 'sm' : size
}

/**
 * Classes d'un bouton, réutilisables sur un lien (`<AppLink className={buttonClassName(...)}>`)
 * pour éviter d'imbriquer un `<button>` dans un `<a>`.
 */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}): string {
  return `${BASE_STYLES} ${VARIANTS[resolveVariant(variant)]} ${SIZES[resolveSize(size)]} ${className}`.trim()
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      icon,
      className = '',
      disabled,
      type = 'button',
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, className })}
        disabled={isDisabled}
        aria-busy={ariaBusy ?? isLoading}
        aria-disabled={ariaDisabled ?? isDisabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center" aria-hidden>
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          </span>
        ) : icon ? (
          <span className="flex items-center" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default memo(Button)
