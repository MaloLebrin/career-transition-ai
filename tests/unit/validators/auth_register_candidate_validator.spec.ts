import {
  CANDIDATE_PASSWORD_MIN_LENGTH,
  registerCandidateValidator,
} from '#validators/auth/auth_register_candidate_validator'
import { test } from '@japa/runner'

async function errorsOf(payload: unknown): Promise<string[]> {
  try {
    await registerCandidateValidator.validate(payload)
    return []
  } catch (error: any) {
    return (error.messages as Array<{ field: string }>).map((m) => m.field)
  }
}

test.group('registerCandidateValidator (#93)', () => {
  test('accepte un payload valide et normalise l’e-mail et le nom', async ({ assert }) => {
    const result = await registerCandidateValidator.validate({
      email: '  Camille.Durand@example.com ',
      password: 'motdepasse-8',
      name: '  Camille Durand ',
      acceptTerms: 'on',
    })

    assert.equal(result.email, 'Camille.Durand@example.com')
    assert.equal(result.name, 'Camille Durand')
    assert.equal(result.password, 'motdepasse-8')
    // VineJS valide la valeur sans la convertir : « acceptée » ⇔ dans sa liste blanche.
    assert.ok(result.acceptTerms)
  })

  test('accepte les valeurs « acceptées » d’une case à cocher', async ({ assert }) => {
    for (const acceptTerms of ['on', '1', 'true', 'yes', true]) {
      const result = await registerCandidateValidator.validate({
        email: 'c@example.com',
        password: 'motdepasse-8',
        name: 'C',
        acceptTerms,
      })
      assert.ok(result.acceptTerms)
    }
  })

  test('refuse une case CGU non cochée', async ({ assert }) => {
    for (const acceptTerms of [undefined, '', 'off', '0', 'false', false]) {
      assert.include(
        await errorsOf({
          email: 'c@example.com',
          password: 'motdepasse-8',
          name: 'C',
          acceptTerms,
        }),
        'acceptTerms'
      )
    }
  })

  test(`refuse un mot de passe de moins de ${CANDIDATE_PASSWORD_MIN_LENGTH} caractères`, async ({
    assert,
  }) => {
    assert.equal(CANDIDATE_PASSWORD_MIN_LENGTH, 8)
    assert.include(
      await errorsOf({ email: 'c@example.com', password: 'court7!', name: 'C', acceptTerms: 'on' }),
      'password'
    )
  })

  test('refuse un e-mail invalide et un nom vide', async ({ assert }) => {
    const fields = await errorsOf({
      email: 'pas-un-email',
      password: 'motdepasse-8',
      name: '   ',
      acceptTerms: 'on',
    })
    assert.includeMembers(fields, ['email', 'name'])
  })

  test('ne laisse passer ni rôle ni organisation', async ({ assert }) => {
    const result = await registerCandidateValidator.validate({
      email: 'c@example.com',
      password: 'motdepasse-8',
      name: 'C',
      acceptTerms: 'on',
      role: 'super_admin',
      organizationId: 1,
    })

    assert.notProperty(result, 'role')
    assert.notProperty(result, 'organizationId')
  })
})
