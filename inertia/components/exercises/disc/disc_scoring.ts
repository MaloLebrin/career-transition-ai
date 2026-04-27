import type { DiscTrait } from './discQuestionnaire'

export type DiscSelection = { most: DiscTrait | ''; least: DiscTrait | '' }

export type DiscScores = Record<DiscTrait, number>

export const DISC_TRAITS: DiscTrait[] = ['D', 'I', 'S', 'C']

export const DISC_TRAIT_LABELS: Record<DiscTrait, string> = {
  D: 'Dominant',
  I: 'Influent',
  S: 'Stable',
  C: 'Consciencieux',
}

export const DISC_TRAIT_COLORS: Record<
  DiscTrait,
  { name: string; bg: string; text: string; ring: string; fill: string }
> = {
  D: {
    name: 'Rouge',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-200',
    fill: 'bg-red-500',
  },
  I: {
    name: 'Jaune',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    fill: 'bg-amber-300',
  },
  S: {
    name: 'Vert',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    fill: 'bg-emerald-500',
  },
  C: {
    name: 'Bleu',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    ring: 'ring-sky-200',
    fill: 'bg-sky-500',
  },
}

export type DiscComputation = {
  version: 2
  blocksCount: number
  raw: DiscScores
  mostCount: DiscScores
  leastCount: DiscScores
  /** Normalisé 0..100 (arrondi). */
  percent: DiscScores
  dominant: DiscTrait
  secondary: DiscTrait
}

function emptyScores(initial = 0): DiscScores {
  return { D: initial, I: initial, S: initial, C: initial }
}

function isTrait(value: any): value is DiscTrait {
  return value === 'D' || value === 'I' || value === 'S' || value === 'C'
}

/**
 * Calcule les scores DISC à partir des sélections.
 * - most => +1
 * - least => -1
 */
export function computeDiscFromSelections(
  selections: Record<number, DiscSelection>,
  blocksCount: number
): DiscComputation {
  const raw = emptyScores(0)
  const mostCount = emptyScores(0)
  const leastCount = emptyScores(0)

  Object.values(selections).forEach((sel) => {
    if (sel?.most && isTrait(sel.most)) {
      raw[sel.most] += 1
      mostCount[sel.most] += 1
    }
    if (sel?.least && isTrait(sel.least)) {
      raw[sel.least] -= 1
      leastCount[sel.least] += 1
    }
  })

  // Normalisation simple sur l’intervalle théorique [-N, +N]
  // percent = (score + N) / (2N) * 100
  const N = Math.max(1, blocksCount)
  const percent: DiscScores = {
    D: Math.round(((raw.D + N) / (2 * N)) * 100),
    I: Math.round(((raw.I + N) / (2 * N)) * 100),
    S: Math.round(((raw.S + N) / (2 * N)) * 100),
    C: Math.round(((raw.C + N) / (2 * N)) * 100),
  }

  const order: DiscTrait[] = [...DISC_TRAITS]

  const sorted = order.sort((a, b) => {
    const byPercent = percent[b] - percent[a]
    if (byPercent !== 0) return byPercent

    const byMost = mostCount[b] - mostCount[a]
    if (byMost !== 0) return byMost

    const byLeast = leastCount[a] - leastCount[b] // moins de "least" est meilleur
    if (byLeast !== 0) return byLeast

    // ordre stable final
    return 0
  })

  const dominant = sorted[0]
  const secondary = sorted[1] ?? sorted[0]

  return {
    version: 2,
    blocksCount,
    raw,
    mostCount,
    leastCount,
    percent,
    dominant,
    secondary,
  }
}
