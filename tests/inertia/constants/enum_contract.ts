import { expect } from 'vitest'

/**
 * Contrat commun des enums partagés (`shared/constants/*`) :
 * `{ CLE: 'valeur' } as const` + tableau `*Values` dérivé.
 *
 * Les migrations construisent leurs contraintes CHECK SQL à partir de ces
 * tableaux : une valeur modifiée ici sans nouvelle migration désynchronise la
 * base déjà migrée. Les specs figent donc aussi la liste exacte des valeurs.
 */
export function expectConsistentEnum(
  enumObject: Record<string, string>,
  values: readonly string[],
  expected: readonly string[]
): void {
  expect([...values], 'le tableau *Values suit l’objet, dans l’ordre').toEqual(
    Object.values(enumObject)
  )
  expect(new Set(values).size, 'valeurs uniques').toBe(values.length)
  for (const key of Object.keys(enumObject)) {
    expect(key, 'clé en MAJUSCULES_SNAKE').toMatch(/^[A-Z][A-Z0-9_]*$/)
  }
  for (const value of values) {
    expect(value, 'valeur stockée en minuscules, sans espace').toMatch(/^[a-z][a-z0-9_-]*$/)
  }
  expect([...values], 'valeurs figées (CHECK SQL : nouvelle migration requise)').toEqual(expected)
}
