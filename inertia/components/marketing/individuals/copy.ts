import { B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import { EXERCISE_LIST } from '#shared/constants/exercises'

const NUMBER_WORDS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
]

/** Compteur en lettres, dérivé des constantes partagées (jamais écrit en dur). */
export function countWord(count: number): string {
  return NUMBER_WORDS[count] ?? String(count)
}

export const TOTAL_WORD = countWord(EXERCISE_LIST.length)
export const FREE_WORD = countWord(B2C_FREE_EXERCISE_TYPES.length)
export const FREE_TITLE = `${FREE_WORD.charAt(0).toUpperCase()}${FREE_WORD.slice(1)} exercices offerts`

/** Exercices du catalogue accessibles sans paiement. */
export const FREE_EXERCISES = EXERCISE_LIST.filter((entry) =>
  (B2C_FREE_EXERCISE_TYPES as readonly string[]).includes(entry.slug)
)

export const INCLUDED = [
  `Les ${TOTAL_WORD} exercices du parcours et leurs résultats détaillés`,
  'Les analyses IA de chaque exercice',
  'Votre synthèse de parcours et son export PDF',
  'La possibilité de demander un accompagnement par un expert',
]

export const EXCLUDED = [
  'Les séances avec un expert (tarif et contrat à part, sur demande)',
  'Un abonnement : le forfait est réglé une fois, sans reconduction',
]

export const LINK_CLASS = 'text-sm font-medium text-accent hover:underline'
