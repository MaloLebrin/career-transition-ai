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
    const org = await Organization.create({
      name: 'Org VC',
      slug: `org-vc-${Date.now()}`,
    })

    const password = 'secret123'
    const user = await User.create({
      organizationId: org.id,
      email: 'valid@example.com',
      name: 'Valid User',
      password: await hash.make(password),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()
    const result = await service.verifyCredentials('valid@example.com', password)

    assert.equal(result.id, user.id)
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
    const service = new AuthService()
    const dto = await service.register({
      email: 'new@example.com',
      password: 'secret123',
      name: 'New User',
      role: USERS_ROLES.ADVISOR,
    })

    assert.equal(dto.email, 'new@example.com')
    assert.equal(dto.name, 'New User')

    const user = await User.findByOrFail('email', 'new@example.com')
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

