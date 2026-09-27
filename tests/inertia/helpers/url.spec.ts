import { describe, expect, test } from 'vitest'
import { isUrl } from '#shared/helpers/url'

describe('isUrl', () => {
  test('reconnaît les URL http et https', () => {
    expect(isUrl('https://meet.example.com/abc')).toBe(true)
    expect(isUrl('http://localhost:3333')).toBe(true)
  })

  test('rejette les adresses physiques et chaînes sans schéma', () => {
    expect(isUrl('12 rue de la Paix, Paris')).toBe(false)
    expect(isUrl('www.example.com')).toBe(false)
    expect(isUrl('')).toBe(false)
  })
})
