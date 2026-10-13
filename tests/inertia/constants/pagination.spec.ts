import { LIST_PAGE_SIZE, LIST_SEARCH_MAX_LENGTH } from '#shared/constants/pagination'
import { describe, expect, test } from 'vitest'

describe('constantes de pagination', () => {
  test('taille de page et longueur de recherche sont des entiers positifs', () => {
    expect(Number.isInteger(LIST_PAGE_SIZE)).toBe(true)
    expect(LIST_PAGE_SIZE).toBeGreaterThan(0)
    expect(Number.isInteger(LIST_SEARCH_MAX_LENGTH)).toBe(true)
    expect(LIST_SEARCH_MAX_LENGTH).toBeGreaterThan(0)
  })
})
