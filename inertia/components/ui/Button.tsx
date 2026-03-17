import React, { forwardRef, memo } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'dark'
  | 'danger'
  | 'lime'
  | 'terracotta'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: React.ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-sage text-white shadow-lg shadow-brand-sage/10 hover:bg-brand-sage/90',
  secondary: 'border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white',
  terracotta:
    'bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20 hover:bg-brand-terracotta/90',
  lime: 'bg-brand-sage text-white hover:bg-brand-sage/90',
  outline:
    'bg-white border-2 border-brand-navy/10 text-brand-navy/60 hover:border-brand-navy hover:text-brand-navy',
  ghost: 'bg-transparent text-brand-navy/40 hover:text-brand-navy',
  dark: 'bg-brand-navy text-white shadow-xl shadow-brand-navy/20 hover:bg-brand-navy/90',
  danger: 'bg-rose-500 text-white shadow-lg shadow-rose-100 hover:bg-rose-600',
}

const SIZES: Record<ButtonSize, string> = {
  xs: 'px-3 py-2 text-[9px] uppercase tracking-wider rounded-md',
  sm: 'px-4 py-2 text-[10px] uppercase tracking-wider rounded-xl',
  md: 'px-6 py-3.5 text-sm rounded-2xl',
  lg: 'px-10 py-5 text-base rounded-3xl',
}

const BASE_STYLES =
  'inline-flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

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
        className={`${BASE_STYLES} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        disabled={isDisabled}
        aria-busy={ariaBusy ?? isLoading}
        aria-disabled={ariaDisabled ?? isDisabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 flex items-center justify-center" aria-hidden>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </span>
        ) : icon ? (
          <span className="mr-2" aria-hidden>
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
