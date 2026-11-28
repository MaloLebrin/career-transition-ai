import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { AccountDisabledError } from '#exceptions/auth_errors'
import { PlatformOrganizationMissingError } from '#exceptions/platform_errors'
import { AuthService } from '#services/auth_service'
import type { EmailVerificationService } from '#services/email_verification_service'
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

  /** Revue de #143 : une adresse enregistrée avec des majuscules reste utilisable. */
  test('verifyCredentials retrouve un compte sans tenir compte de la casse, si un seul correspond', async ({
    assert,
  }) => {
    const service = new AuthService()
    const user = await createAdvisor()
    user.email = 'Claire.Conseil@Example.com'
    user.password = 'secret123'
    await user.save()

    const found = await service.verifyCredentials('claire.conseil@example.com', 'secret123')
    assert.equal(found.id, user.id)

    // Deux comptes ne différant que par la casse (organisations distinctes) : aucun n'est choisi.
    const twin = await createAdvisor()
    twin.email = 'CLAIRE.CONSEIL@EXAMPLE.COM'
    await twin.save()
    await assert.rejects(() => service.verifyCredentials('claire.conseil@example.com', 'secret123'))
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

  test('verifyCredentials refuse un compte désactivé, seulement après le bon mot de passe (#73)', async ({
    assert,
  }) => {
    const email = `disabled-${Date.now()}@example.com`
    const service = new AuthService()
    await service.register({
      email,
      password: 'secret123',
      name: 'Disabled User',
      role: USERS_ROLES.ADVISOR,
      organizationName: `Org disabled ${Date.now()}`,
    })
    await User.query().where('email', email).update({ disabledAt: new Date() })

    await assert.rejects(() => service.verifyCredentials(email, 'secret123'), AccountDisabledError)
    // Un mauvais mot de passe ne révèle rien de l'état du compte.
    await assert.rejects(
      () => service.verifyCredentials(email, 'mauvais'),
      'Identifiants invalides'
    )
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
    assert.equal(user.role, USERS_ROLES.ADMIN, 'le propriétaire du cabinet en est l’administrateur')
    assert.equal(dto.role, USERS_ROLES.ADMIN)
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

  /**
   * #143 : le nom change tout de suite, l'e-mail seulement après le clic sur
   * le lien envoyé à la nouvelle adresse (délégué à `EmailVerificationService`).
   */
  test('updateProfile met le nom à jour et demande la confirmation de la nouvelle adresse', async ({
    assert,
  }) => {
    const user = await createAdvisor()
    const oldEmail = user.email
    const requested: Array<[number, string]> = []
    const emailVerification = {
      requestEmailChange: async (u: User, email: string) => {
        requested.push([u.id, email])
        return email
      },
    } as unknown as EmailVerificationService
    const service = new AuthService(undefined, emailVerification)

    const result = await service.updateProfile(user, {
      name: 'New Name',
      email: 'new@example.com',
    })

    assert.deepEqual(result, { pendingEmail: 'new@example.com' })
    assert.deepEqual(requested, [[user.id, 'new@example.com']])
    await user.refresh()
    assert.equal(user.name, 'New Name')
    assert.equal(user.email, oldEmail)
  })

  test('updateProfile : adresse refusée, le nom ne change pas', async ({ assert }) => {
    const user = await createAdvisor()
    const emailVerification = {
      requestEmailChange: async () => {
        throw new Error('Cette adresse e-mail est déjà utilisée par un autre compte.')
      },
    } as unknown as EmailVerificationService
    const service = new AuthService(undefined, emailVerification)

    await assert.rejects(
      () => service.updateProfile(user, { name: 'Autre', email: 'pris@example.com' }),
      /déjà utilisée/
    )
    await user.refresh()
    assert.notEqual(user.name, 'Autre')
  })
})

test.group('AuthService.registerCandidate (#93)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /** Double du service de vérification d'e-mail (#98) : enregistre les comptes à qui le lien part. */
  function makeService() {
    const linksSentTo: number[] = []
    const emailVerification = {
      async sendLinkSafely(user: User) {
        linksSentTo.push(user.id)
      },
    } as unknown as EmailVerificationService
    return { service: new AuthService(undefined, emailVerification), linksSentTo }
  }

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
    const { service, linksSentTo } = makeService()

    const dto = await service.registerCandidate(data)

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
    // Le lien de vérification part après le commit (#98).
    assert.deepEqual(linksSentTo, [user.id])
  })

  test('refuse un e-mail déjà pris par un compte de n’importe quelle organisation', async ({
    assert,
  }) => {
    await createPlatformOrganization()
    const advisor = await createAdvisor()
    const { service, linksSentTo } = makeService()

    await assert.rejects(
      () => service.registerCandidate({ ...input(), email: advisor.email }),
      'Cet email est déjà utilisé.'
    )
    assert.lengthOf(await Employee.query().where('email', advisor.email), 0)
    assert.deepEqual(linksSentTo, [])
  })

  test('sans organisation plateforme : PlatformOrganizationMissingError, rien de créé', async ({
    assert,
  }) => {
    await Organization.query().where('isPlatform', true).delete()
    const data = input()

    await assert.rejects(
      () => makeService().service.registerCandidate(data),
      PlatformOrganizationMissingError
    )
    assert.isNull(await User.findBy('email', data.email))
  })
})
