import { describe, test, expect } from 'vitest'
import {
  validateLogin,
  validateRegister,
  hasErrors,
  type LoginFields,
  type RegisterFields,
} from '../../../inertia/lib/authValidation'

describe('authValidation', () => {
  describe('validateLogin', () => {
    test('returns no errors for valid email and password', () => {
      const data: LoginFields = { email: 'user@example.com', password: 'secret12' }
      expect(validateLogin(data)).toEqual({})
    })

    test('trims email and password before validation', () => {
      const data: LoginFields = { email: '  user@example.com  ', password: '  secret12  ' }
      expect(validateLogin(data)).toEqual({})
    })

    test('returns error when email is empty', () => {
      expect(validateLogin({ email: '', password: 'secret12' }).email).toContain('email est requis')
    })

    test('returns error when email is only whitespace', () => {
      expect(validateLogin({ email: '   ', password: 'secret12' }).email).toContain(
        'email est requis'
      )
    })

    test('returns error when email format is invalid', () => {
      expect(validateLogin({ email: 'not-an-email', password: 'secret12' }).email).toContain(
        'pas valide'
      )
    })

    test('returns error when email exceeds 255 characters', () => {
      const long = 'a'.repeat(256) + '@example.com'
      expect(validateLogin({ email: long, password: 'secret12' }).email).toContain('255')
    })

    test('returns error when password is empty', () => {
      expect(validateLogin({ email: 'u@e.com', password: '' }).password).toBe(
        'Le mot de passe est requis.'
      )
    })

    test('returns error when password has less than 6 characters', () => {
      expect(validateLogin({ email: 'u@e.com', password: '12345' }).password).toContain('6')
    })

    test('returns error when password exceeds 255 characters', () => {
      expect(validateLogin({ email: 'u@e.com', password: 'a'.repeat(256) }).password).toContain(
        '255'
      )
    })

    test('returns multiple errors when both email and password are invalid', () => {
      const errors = validateLogin({ email: '', password: '' })
      expect(errors.email).toBeDefined()
      expect(errors.password).toBeDefined()
    })
  })

  describe('validateRegister', () => {
    const valid: RegisterFields = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'secret12',
      organizationName: 'Cabinet Expert',
      role: 'advisor',
    }

    test('returns no errors for valid payload', () => {
      expect(validateRegister(valid)).toEqual({})
    })

    test('returns error when name is empty', () => {
      expect(validateRegister({ ...valid, name: '' }).name).toBe('Le nom est requis.')
    })

    test('returns error when name exceeds 255 characters', () => {
      expect(validateRegister({ ...valid, name: 'a'.repeat(256) }).name).toContain('255')
    })

    test('returns error when email is invalid', () => {
      expect(validateRegister({ ...valid, email: 'bad' }).email).toContain('pas valide')
    })

    test('returns error when password is too short', () => {
      expect(validateRegister({ ...valid, password: '12345' }).password).toContain('6')
    })

    test('returns error when organization name is empty', () => {
      expect(validateRegister({ ...valid, organizationName: '' }).organizationName).toBe(
        'Le nom de l’organisation est requis.'
      )
    })

    test('returns error when organization name exceeds 255 characters', () => {
      expect(
        validateRegister({ ...valid, organizationName: 'a'.repeat(256) }).organizationName
      ).toContain('255')
    })

    test('returns multiple errors for multiple invalid fields', () => {
      const errors = validateRegister({
        name: '',
        email: 'x',
        password: '1',
        organizationName: '',
        role: 'advisor',
      })
      expect(errors.name).toBeDefined()
      expect(errors.email).toBeDefined()
      expect(errors.password).toBeDefined()
      expect(errors.organizationName).toBeDefined()
    })
  })

  describe('hasErrors', () => {
    test('returns false for empty object', () => {
      expect(hasErrors({})).toBe(false)
    })

    test('returns false when all values are undefined or empty string', () => {
      expect(hasErrors({ email: undefined, password: '' })).toBe(false)
    })

    test('returns true when at least one value is non-empty string', () => {
      expect(hasErrors({ email: 'Error' })).toBe(true)
      expect(hasErrors({ email: undefined, password: 'Required' })).toBe(true)
    })
  })
})
