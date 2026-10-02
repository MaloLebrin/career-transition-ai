import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { PlatformOrganizationMissingError } from '#exceptions/platform_errors'
import { AuthService } from '#services/auth_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { TERMS_VERSION } from '#shared/constants/legal'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdvisor, createPlatformOrganization } from '#tests/support/actors'
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
    assert.isNotNull(user.onboardingCompletedAt)
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
})

test.group('AuthService.registerCandidate (#93)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const input = () => ({
    email: `particulier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'motdepasse-8',
    name: '  Camille Durand ',
  })

  test('crée le compte employee et la fiche b2c non onboardée dans l’organisation plateforme', async ({
    assert,
  }) => {
    const platform = await createPlatformOrganization()
    const data = input()

    const dto = await new AuthService().registerCandidate(data)

    assert.equal(dto.email, data.email)
    assert.equal(dto.name, 'Camille Durand')
    assert.equal(dto.role, USERS_ROLES.EMPLOYEE)
    assert.equal(dto.organizationId, platform.id)
    assert.equal(dto.accountType, ACCOUNT_TYPES.B2C)

    const user = await User.findByOrFail('email', data.email)
    assert.equal(user.termsVersion, TERMS_VERSION)
    assert.isNotNull(user.termsAcceptedAt)
    assert.isNotNull(user.onboardingCompletedAt)
    assert.isNull(user.emailVerifiedAt)
    assert.isTrue(await hash.verify(user.password, data.password))

    const employee = await Employee.findByOrFail('userId', user.id)
    assert.equal(employee.organizationId, platform.id)
    assert.equal(employee.accountType, ACCOUNT_TYPES.B2C)
    assert.isNull(employee.advisorId)
    assert.isFalse(employee.onboarded)
    assert.equal(employee.status, EMPLOYEES_STATUS.ONBOARDING)
    assert.equal(employee.name, 'Camille Durand')
    assert.equal(employee.email, data.email)
  })

  test('refuse un e-mail déjà pris par un compte de n’importe quelle organisation', async ({
    assert,
  }) => {
    await createPlatformOrganization()
    const advisor = await createAdvisor()
    const service = new AuthService()

    await assert.rejects(
      () => service.registerCandidate({ ...input(), email: advisor.email }),
      'Cet email est déjà utilisé.'
    )
    assert.lengthOf(await Employee.query().where('email', advisor.email), 0)
  })

  test('sans organisation plateforme : PlatformOrganizationMissingError, rien de créé', async ({
    assert,
  }) => {
    await Organization.query().where('isPlatform', true).delete()
    const data = input()

    await assert.rejects(
      () => new AuthService().registerCandidate(data),
      PlatformOrganizationMissingError
    )
    assert.isNull(await User.findBy('email', data.email))
  })
})
