import { describe, expect, test } from 'vitest'
import { RATE_LIMIT_ERROR_KEY, rateLimitError, rateLimitMessage } from '#shared/helpers/rate_limit'

describe('rateLimitMessage', () => {
  test('une minute ou moins : « dans une minute »', () => {
    expect(rateLimitMessage(0)).toBe('Trop de tentatives. Réessayez dans une minute.')
    expect(rateLimitMessage(59)).toBe('Trop de tentatives. Réessayez dans une minute.')
    expect(rateLimitMessage(60)).toBe('Trop de tentatives. Réessayez dans une minute.')
  })

  test('au-delà : minutes arrondies au supérieur', () => {
    expect(rateLimitMessage(61)).toBe('Trop de tentatives. Réessayez dans 2 minutes.')
    expect(rateLimitMessage(3600)).toBe('Trop de tentatives. Réessayez dans 60 minutes.')
  })
})

describe('rateLimitError', () => {
  test('renvoie le message flashé sous la clé de rate limiting', () => {
    expect(rateLimitError({ [RATE_LIMIT_ERROR_KEY]: 'Trop de tentatives.' })).toBe(
      'Trop de tentatives.'
    )
  })

  test('ignore les erreurs de champ ordinaires', () => {
    expect(rateLimitError({ email: 'Requis' })).toBeUndefined()
    expect(rateLimitError({})).toBeUndefined()
  })
})
