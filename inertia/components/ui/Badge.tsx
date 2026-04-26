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
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  lime: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  pink: 'bg-pink-50 text-pink-600 border-pink-200',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  slate: 'bg-brand-navy/5 text-brand-navy/60 border-brand-navy/10',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
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
