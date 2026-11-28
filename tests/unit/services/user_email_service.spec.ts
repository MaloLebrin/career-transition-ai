import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import User from '#models/user'
import { UserEmailService } from '#services/user_email_service'
import { createAdvisor, createOrganization } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const service = new UserEmailService()

async function advisorWithEmail(email: string): Promise<User> {
  const user = await createAdvisor()
  user.email = email
  await user.save()
  return user
}

test.group('UserEmailService.normalize', () => {
  test('retire les espaces et passe en minuscules', ({ assert }) => {
    assert.equal(
      UserEmailService.normalize('  Claire.Conseil@Example.COM '),
      'claire.conseil@example.com'
    )
  })
})

test.group('UserEmailService.findByEmail', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('retrouve le compte sans tenir compte de la casse ni des espaces', async ({ assert }) => {
    const user = await advisorWithEmail('Claire.Conseil@Example.com')

    const found = await service.findByEmail('  CLAIRE.conseil@example.COM ')

    assert.equal(found?.id, user.id)
  })

  test('null si aucun compte ne porte l’adresse', async ({ assert }) => {
    assert.isNull(await service.findByEmail('personne@example.test'))
  })
})

test.group('UserEmailService.isTaken / assertAvailable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une adresse d’une autre organisation est prise, casse comprise', async ({ assert }) => {
    await advisorWithEmail('pris@example.test')
    await createOrganization()

    assert.isTrue(await service.isTaken('PRIS@example.test'))
    await assert.rejects(
      () => service.assertAvailable('Pris@Example.test'),
      EmailAlreadyUsedException
    )
  })

  test('le compte lui-même ne se compte pas comme doublon (changement de casse)', async ({
    assert,
  }) => {
    const user = await advisorWithEmail('moi@example.test')

    assert.isFalse(await service.isTaken('MOI@example.test', { exceptUserId: user.id }))
    await service.assertAvailable('Moi@example.test', { exceptUserId: user.id })
  })

  test('une adresse libre passe', async ({ assert }) => {
    assert.isFalse(await service.isTaken('libre@example.test'))
    await service.assertAvailable('libre@example.test')
  })

  test('l’erreur est une erreur de domaine 409, message personnalisable', async ({ assert }) => {
    await advisorWithEmail('pris@example.test')

    try {
      await service.assertAvailable('pris@example.test', { message: 'Déjà pris.' })
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, EmailAlreadyUsedException)
      assert.equal((error as EmailAlreadyUsedException).status, 409)
      assert.equal((error as EmailAlreadyUsedException).code, 'E_EMAIL_ALREADY_USED')
      assert.equal((error as EmailAlreadyUsedException).message, 'Déjà pris.')
    }
  })
})

test.group('users.email — index unique lower(email) (#169)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la base refuse un second compte à la même adresse, autre organisation et autre casse', async ({
    assert,
  }) => {
    const first = await advisorWithEmail('jumeau@example.test')
    const otherOrg = await createOrganization()

    await assert.rejects(
      () =>
        User.create({
          organizationId: otherOrg.id,
          email: 'JUMEAU@example.test',
          name: 'Jumeau',
          password: 'x',
          role: 'advisor',
        }),
      /users_email_lower_unique/
    )
    assert.notEqual(first.organizationId, otherOrg.id)
  })
})
