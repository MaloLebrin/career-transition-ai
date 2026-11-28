import type { RankedItem } from '#shared/types/exercise/ranking'
import { motivationDefinition } from '../../../constants/motivations'
import { DefinitionTooltip } from '../../ui/DefinitionTooltip'

const RANKING_TONES = {
  lake: 'bg-tint-lake text-tint-lake-ink',
  apricot: 'bg-tint-apricot text-tint-apricot-ink',
} as const

export function MotivationRankingColumn({
  title,
  items,
  tone,
}: {
  title: string
  items: RankedItem[]
  tone: keyof typeof RANKING_TONES
}) {
  if (items.length === 0) return null
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-card">
      <h6 className="mb-4 text-base font-semibold text-ink">{title}</h6>
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.rank} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${RANKING_TONES[tone]}`}
            >
              <span className="sr-only">Rang </span>
              {item.rank}
            </span>
            <span className="min-w-0 text-sm font-semibold leading-snug text-ink">
              <DefinitionTooltip label={item.label} definition={motivationDefinition(item.label)} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
