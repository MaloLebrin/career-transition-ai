import Organization from '#models/organization'
import User from '#models/user'
import { AuthService } from '#domains/auth/services/auth_service'
import { USERS_ROLES } from '#shared/constants/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('AuthService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
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

    assert.equal(dto.id, user.id)
    assert.equal(dto.organizationId, org.id)
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
      organizationName: `Org ${Date.now()}`,
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
      organizationName: `Org ${Date.now()}`,
    })

    assert.equal(dto.email, uniqueEmail)
    assert.equal(dto.name, 'New User')

    const user = await User.findByOrFail('email', uniqueEmail)
    assert.equal(dto.id, user.id)
    assert.equal(dto.organizationId, user.organizationId)
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
        organizationName: 'Other Org',
      })
      assert.fail('Expected register to throw')
    } catch (error: any) {
      assert.include(error.message, 'déjà utilisé')
    }
  })

  test('updateProfile updates name and email', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Profile',
      slug: `org-profile-${Date.now()}`,
    })

    const oldEmail = `old-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const newEmail = `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`

    const user = await User.create({
      organizationId: org.id,
      email: oldEmail,
      name: 'Old Name',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()
    const dto = await service.updateProfile(user, {
      name: 'New Name',
      email: newEmail,
    })

    assert.equal(dto.name, 'New Name')
    assert.equal(dto.email, newEmail)

    await user.refresh()
    assert.equal(user.name, 'New Name')
    assert.equal(user.email, newEmail)
  })

  test('updateProfile rejects duplicate email', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Profile Dup',
      slug: `org-profile-dup-${Date.now()}`,
    })

    const existing = await User.create({
      organizationId: org.id,
      email: 'existing@example.com',
      name: 'Existing',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    const user = await User.create({
      organizationId: org.id,
      email: 'user@example.com',
      name: 'User',
      password: await hash.make('secret123'),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()

    try {
      await service.updateProfile(user, {
        name: 'User',
        email: existing.email,
      })
      assert.fail('Expected updateProfile to throw on duplicate email')
    } catch (error: any) {
      assert.include(error.message, 'déjà utilisé')
    }
  })

  test('resetPasswordForUser resets password and returns temporary password', async ({
    assert,
  }) => {
    const org = await Organization.create({
      name: 'Org Reset',
      slug: `org-reset-${Date.now()}`,
    })

    const email = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`

    const user = await User.create({
      organizationId: org.id,
      email,
      name: 'Reset User',
      password: await hash.make('old-password'),
      role: USERS_ROLES.ADVISOR,
    })

    const service = new AuthService()
    const result = await service.resetPasswordForUser(user.id)

    assert.isNotNull(result)
    assert.equal(result!.user.id, user.id)
    assert.isTrue(result!.temporaryPassword.length > 0)
  })

  test('resetPasswordForUser returns null for missing user', async ({ assert }) => {
    const service = new AuthService()
    const result = await service.resetPasswordForUser(999999)
    assert.isNull(result)
  })
})
