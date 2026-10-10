import { ChevronDown } from 'lucide-react'
import React from 'react'

export interface FaqItem {
  question: string
  answer: React.ReactNode
}

/**
 * Questions fréquentes en accordéon natif (`<details>`) : rendu complet côté serveur,
 * clavier et lecteurs d'écran pris en charge par le navigateur.
 */
export const FaqAccordion: React.FC<{ items: FaqItem[] }> = ({ items }) => (
  <div className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface shadow-card">
    {items.map((item) => (
      <details
        key={item.question}
        className="group px-6 [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-ink">
          {item.question}
          <ChevronDown
            className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="pb-5 text-sm leading-relaxed text-muted">{item.answer}</div>
      </details>
    ))}
  </div>
)
