import React, { memo } from 'react'

export type BadgeVariant =
  | 'violet'
  | 'lime'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: BadgeVariant
}

const THEMES: Record<BadgeVariant, string> = {
  violet: 'bg-brand-sage/10 text-brand-sage border-brand-sage/20',
  lime: 'bg-brand-sage/10 text-brand-sage border-brand-sage/20',
  orange: 'bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20',
  pink: 'bg-rose-50 text-rose-600 border-rose-100',
  cyan: 'bg-sky-50 text-sky-600 border-sky-100',
  slate: 'bg-brand-navy/5 text-brand-navy/60 border-brand-navy/10',
  indigo: 'bg-brand-sage/10 text-brand-sage border-brand-sage/20',
  emerald: 'bg-brand-sage/10 text-brand-sage border-brand-sage/20',
  amber: 'bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20',
}

const Badge = memo(function Badge({
  children,
  variant = 'slate',
  className = '',
  ...props
}: BadgeProps) {
  const theme = THEMES[variant] ?? THEMES.slate
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge
