import { Check } from 'lucide-react'
import React from 'react'

export interface BulletItem {
  title: string
  description: string
}

export interface BulletListProps {
  items: BulletItem[]
  className?: string
}

/** Liste d'arguments avec coche sur tuile soleil, titre et description. */
export const BulletList: React.FC<BulletListProps> = ({ items, className = '' }) => (
  <ul className={`space-y-5 ${className}`.trim()}>
    {items.map((item) => (
      <li key={item.title} className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint-sun text-ink"
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-ink">{item.title}</p>
          <p className="text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      </li>
    ))}
  </ul>
)
