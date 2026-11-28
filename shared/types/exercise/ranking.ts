/** Un élément d'un classement d'exercice, avec son rang réel (à partir de 1). */
export type RankedItem = { rank: number; label: string }

/** Les premiers et les derniers éléments d'un classement, sans chevauchement. */
export type RankingExtremes = { top: RankedItem[]; bottom: RankedItem[] }
