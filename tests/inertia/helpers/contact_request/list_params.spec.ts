import { parseContactRequestListParams } from '#shared/helpers/contact_request/list_params'
import { describe, expect, test } from 'vitest'

describe('parseContactRequestListParams', () => {
  test('lit page, recherche, statut et type valides', () => {
    expect(
      parseContactRequestListParams({
        page: '2',
        search: ' acme ',
        status: 'treated',
        type: 'demo',
      })
    ).toEqual({ page: 2, search: 'acme', status: 'treated', type: 'demo' })
  })

  test('un statut ou un type inconnu, ou « all », est ignoré', () => {
    expect(parseContactRequestListParams({ status: 'bogus', type: 'all' })).toMatchObject({
      status: null,
      type: null,
    })
    expect(parseContactRequestListParams({})).toEqual({
      page: 1,
      search: '',
      status: null,
      type: null,
    })
  })
})
