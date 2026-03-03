import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import { AuthService } from '#services/auth_service'
import Organization from '#models/organization'
import User, { USERS_ROLES } from '#models/user'

test.group('AuthService', () => {
  test('toSession returns dto from user', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org',
      slug: `org-${Date.now()}`,
    })

    const user = await User.create({
      organizationId: org.id,
      email: 'test@example.com',
      name: 'Test User',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()
    const dto = service.toSession(user)

    assert.equal(dto.id, String(user.id))
    assert.equal(dto.organizationId, String(org.id))
    assert.equal(dto.email, user.email)
    assert.equal(dto.name, user.name)
    assert.equal(dto.role, user.role)
  })

  test('verifyCredentials returns user when credentials are valid', async ({ assert }) => {
    const uniqueEmail = `valid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const password = 'secret123'
    const service = new AuthService()
    await service.register({
      email: uniqueEmail,
      password,
      name: 'Valid User',
      role: USERS_ROLES.ADVISOR,
    })

    const result = await service.verifyCredentials(uniqueEmail, password)

    assert.equal(result.email, uniqueEmail)
    assert.equal(result.name, 'Valid User')
  })

  test('verifyCredentials throws for invalid credentials', async ({ assert }) => {
    const service = new AuthService()

    try {
      await service.verifyCredentials('missing@example.com', 'secret123')
      assert.fail('Expected verifyCredentials to throw')
    } catch (error: any) {
      assert.include(error.message, 'Identifiants invalides')
    }
  })

  test('register creates user in default org and returns session dto', async ({ assert }) => {
    const uniqueEmail = `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const service = new AuthService()
    const dto = await service.register({
      email: uniqueEmail,
      password: 'secret123',
      name: 'New User',
      role: USERS_ROLES.ADVISOR,
    })

    assert.equal(dto.email, uniqueEmail)
    assert.equal(dto.name, 'New User')

    const user = await User.findByOrFail('email', uniqueEmail)
    assert.equal(dto.id, String(user.id))
    assert.equal(dto.organizationId, String(user.organizationId))
  })

  test('register rejects duplicate email', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Dup',
      slug: `org-dup-${Date.now()}`,
    })

    await User.create({
      organizationId: org.id,
      email: 'dup@example.com',
      name: 'Existing',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()

    try {
      await service.register({
        email: 'dup@example.com',
        password: 'secret123',
        name: 'Other User',
        role: USERS_ROLES.ADVISOR,
      })
      assert.fail('Expected register to throw')
    } catch (error: any) {
      assert.include(error.message, 'déjà utilisé')
    }
  })
})

