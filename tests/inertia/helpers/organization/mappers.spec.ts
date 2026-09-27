import { describe, expect, test } from 'vitest'
import { DateTime } from 'luxon'
import { mapOrganization } from '#shared/helpers/organization/mappers'

describe('mapOrganization', () => {
  const createdAt = DateTime.fromISO('2024-02-01T08:00:00.000Z', { zone: 'utc' })

  test('sérialise l’organisation avec sa date ISO', () => {
    expect(
      mapOrganization({
        id: 1,
        name: 'Acme',
        slug: 'acme',
        logoUrl: '/logo.png',
        createdAt,
      } as never)
    ).toEqual({
      id: 1,
      name: 'Acme',
      slug: 'acme',
      logoUrl: '/logo.png',
      createdAt: '2024-02-01T08:00:00.000Z',
    })
  })

  test('logo absent → undefined, date invalide → chaîne vide', () => {
    const dto = mapOrganization({
      id: 2,
      name: 'Beta',
      slug: 'beta',
      logoUrl: null,
      createdAt: DateTime.invalid('test'),
    } as never)
    expect(dto.logoUrl).toBeUndefined()
    expect(dto.createdAt).toBe('')
  })
})
