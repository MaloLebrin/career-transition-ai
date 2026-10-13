import {
  parseOrganizationListParams,
  parseUserListParams,
} from '#shared/helpers/super_admin/list_params'
import { describe, expect, test } from 'vitest'

describe('parseOrganizationListParams', () => {
  test('lit page, recherche et seuil de candidats', () => {
    expect(parseOrganizationListParams({ page: '2', search: 'a', minEmployees: '5' })).toEqual({
      page: 2,
      search: 'a',
      minEmployees: 5,
    })
  })

  test('un seuil absent, nul, négatif ou non numérique est ignoré', () => {
    for (const minEmployees of [undefined, '', '0', '-3', 'abc']) {
      expect(parseOrganizationListParams({ minEmployees }).minEmployees).toBeNull()
    }
  })
})

describe('parseUserListParams', () => {
  test('lit un rôle valide', () => {
    expect(parseUserListParams({ role: 'admin', search: 'x' })).toEqual({
      page: 1,
      search: 'x',
      role: 'admin',
    })
  })

  test('un rôle inconnu ou « all » est ignoré', () => {
    expect(parseUserListParams({ role: 'root' }).role).toBeNull()
    expect(parseUserListParams({ role: 'all' }).role).toBeNull()
  })
})
