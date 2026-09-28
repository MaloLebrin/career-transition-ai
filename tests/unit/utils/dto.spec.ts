import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { toSessionDto } from '#utils/dto'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function makeUser(): User {
  const user = new User()
  user.merge({
    organizationId: 7,
    email: 'conseil@example.com',
    password: 'hash-secret',
    name: 'Claire Conseil',
    role: USERS_ROLES.ADVISOR,
    onboardingCompletedAt: DateTime.fromISO('2026-01-01T00:00:00Z'),
    deletedAt: null,
  })
  user.id = 42
  return user
}

test.group('utils/dto — toSessionDto', () => {
  test('expose id, organisation, e-mail, nom et rôle de l’utilisateur', ({ assert }) => {
    assert.deepEqual(toSessionDto(makeUser()), {
      id: 42,
      organizationId: 7,
      email: 'conseil@example.com',
      name: 'Claire Conseil',
      role: USERS_ROLES.ADVISOR,
    })
  })

  test('n’expose jamais le mot de passe ni les champs internes', ({ assert }) => {
    const dto = toSessionDto(makeUser()) as Record<string, unknown>
    assert.notProperty(dto, 'password')
    assert.notProperty(dto, 'onboardingCompletedAt')
    assert.notProperty(dto, 'deletedAt')
    assert.notInclude(JSON.stringify(dto), 'hash-secret')
  })

  test('renvoie un objet simple sérialisable (pas l’instance Lucid)', ({ assert }) => {
    const dto = toSessionDto(makeUser())
    assert.notInstanceOf(dto, User)
    assert.deepEqual(JSON.parse(JSON.stringify(dto)), dto)
  })

  test('reflète le rôle courant (super admin)', ({ assert }) => {
    const user = makeUser()
    user.role = USERS_ROLES.SUPER_ADMIN
    assert.equal(toSessionDto(user).role, 'super_admin')
  })
})
