import React, { memo } from 'react'

export type CardVariant = 'default' | 'flat' | 'dark' | 'amber' | 'sage'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: CardVariant
}

const VARIANTS: Record<CardVariant, string> = {
  default: 'bg-white border border-brand-navy/5 shadow-sm hover:border-brand-sage/20 transition-colors',
  flat: 'bg-brand-ivory/50 border border-brand-navy/5',
  dark: 'bg-brand-navy text-white shadow-2xl',
  amber: 'bg-brand-terracotta/5 border border-brand-terracotta/10',
  sage: 'bg-brand-sage/5 border border-brand-sage/15',
}

const Card = memo(function Card({ children, className, variant = 'default', ...props }: CardProps) {
  return (
    <div className={`p-8 rounded-3xl ${VARIANTS[variant]} ${className ?? ''}`.trim()} {...props}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
