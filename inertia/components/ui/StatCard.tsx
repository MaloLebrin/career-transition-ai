import React, { memo } from 'react'

export type StatCardColor = 'navy' | 'sage' | 'terracotta'

export interface StatCardProps {
  'label': string
  'value': number | string
  'color'?: StatCardColor
  /** Optional accessible description (e.g. "Statistique: 42 utilisateurs") */
  'aria-label'?: string
  'className'?: string
}

const COLORS: Record<StatCardColor, string> = {
  navy: 'bg-brand-navy/10 text-brand-navy',
  sage: 'bg-brand-sage/10 text-brand-sage',
  terracotta: 'bg-brand-terracotta/10 text-brand-terracotta',
}

const StatCard = memo(function StatCard({
  label,
  value,
  color = 'navy',
  'aria-label': ariaLabel,
  className = '',
}: StatCardProps) {
  const description = ariaLabel ?? `${value} ${label}`

  return (
    <article
      className={`bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-sm transition-all hover:shadow-md ${className}`.trim()}
      aria-label={description}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${COLORS[color]} flex items-center justify-center mb-6`}
        aria-hidden
      >
        <svg className="w-6 h-6 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <div className="text-3xl font-bold text-brand-navy mb-1 tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
        {label}
      </div>
    </article>
  )
})

StatCard.displayName = 'StatCard'

export default StatCard
