import { parseEmployeeListParams } from '#shared/helpers/employee/list_params'
import { describe, expect, test } from 'vitest'

describe('parseEmployeeListParams', () => {
  test('lit page, recherche et statut valide', () => {
    expect(parseEmployeeListParams({ page: '2', search: 'ma', status: 'completed' })).toEqual({
      page: 2,
      search: 'ma',
      status: 'completed',
    })
  })

  test('un statut inconnu ou absent donne null', () => {
    expect(parseEmployeeListParams({ status: 'bogus' }).status).toBeNull()
    expect(parseEmployeeListParams({ status: 'all' }).status).toBeNull()
    expect(parseEmployeeListParams({}).status).toBeNull()
  })
})
