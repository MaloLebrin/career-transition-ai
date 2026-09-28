import { describe, expect, test } from 'vitest'
import { APP_NAME } from '#shared/constants/app'

describe('shared/constants/app', () => {
  test('APP_NAME est le nom produit affiché (titres, e-mails)', () => {
    expect(APP_NAME).toBe('Career Transition AI')
  })

  test('APP_NAME est une chaîne non vide, sans espace parasite', () => {
    expect(APP_NAME.trim()).toBe(APP_NAME)
    expect(APP_NAME.length).toBeGreaterThan(0)
  })
})
