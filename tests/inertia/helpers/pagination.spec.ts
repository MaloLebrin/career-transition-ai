import { LIST_SEARCH_MAX_LENGTH } from '#shared/constants/pagination'
import {
  escapeLike,
  listQuery,
  parseListParams,
  parsePage,
  parseSearch,
} from '#shared/helpers/pagination'
import { describe, expect, test } from 'vitest'

describe('parsePage', () => {
  test('entier ≥ 1, sinon 1', () => {
    expect(parsePage('3')).toBe(3)
    expect(parsePage(2)).toBe(2)
    for (const raw of [undefined, null, '', '0', '-2', 'abc']) expect(parsePage(raw)).toBe(1)
  })
})

describe('parseSearch', () => {
  test('rogne et borne le texte', () => {
    expect(parseSearch('  jean  ')).toBe('jean')
    expect(parseSearch('a'.repeat(LIST_SEARCH_MAX_LENGTH + 20))).toHaveLength(
      LIST_SEARCH_MAX_LENGTH
    )
  })

  test("ignore ce qui n'est pas du texte (tableau, objet, nombre)", () => {
    expect(parseSearch(undefined)).toBe('')
    expect(parseSearch(['a', 'b'])).toBe('')
    expect(parseSearch({ a: 1 })).toBe('')
    expect(parseSearch(12)).toBe('')
  })
})

describe('parseListParams', () => {
  test('lit page et recherche', () => {
    expect(parseListParams({ page: '4', search: ' x ' })).toEqual({ page: 4, search: 'x' })
    expect(parseListParams({})).toEqual({ page: 1, search: '' })
  })
})

describe('listQuery', () => {
  test('omet les valeurs par défaut : page 1, texte vide, all, null', () => {
    expect(listQuery({ page: 1, search: '', status: 'all', role: null, x: undefined })).toEqual({})
  })

  test('garde les valeurs utiles sous forme de chaînes', () => {
    expect(listQuery({ page: 2, search: 'jean', status: 'active', minEmployees: 3 })).toEqual({
      page: '2',
      search: 'jean',
      status: 'active',
      minEmployees: '3',
    })
  })
})

describe('escapeLike', () => {
  test('échappe %, _ et \\', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
    expect(escapeLike('jean')).toBe('jean')
  })
})
