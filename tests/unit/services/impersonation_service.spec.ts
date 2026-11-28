import { ImpersonationNotAllowedError, NotImpersonatingError } from '#exceptions/auth_errors'
import { ImpersonationService } from '#services/impersonation_service'
import { createAdvisor, createSuperAdmin } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const service = new ImpersonationService()

test.group('ImpersonationService.findTarget (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renvoie le compte cible, null s’il n’existe pas ou si l’id n’est pas entier', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const advisor = await createAdvisor()

    const target = await service.findTarget(superAdmin, advisor.id)
    assert.equal(target?.id, advisor.id)
    assert.isNull(await service.findTarget(superAdmin, 999999))
    assert.isNull(await service.findTarget(superAdmin, Number.NaN))
  })

  test('refuse soi-même, un autre super admin et un compte désactivé', async ({ assert }) => {
    const superAdmin = await createSuperAdmin()
    const other = await createSuperAdmin()
    const disabled = await createAdvisor()
    disabled.disabledAt = DateTime.now()
    await disabled.save()

    await assert.rejects(
      () => service.findTarget(superAdmin, superAdmin.id),
      ImpersonationNotAllowedError
    )
    await assert.rejects(
      () => service.findTarget(superAdmin, other.id),
      ImpersonationNotAllowedError
    )
    await assert.rejects(
      () => service.findTarget(superAdmin, disabled.id),
      ImpersonationNotAllowedError
    )
  })
})

test.group('ImpersonationService.resolveImpersonator (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('aucune prise d’identité en session : NotImpersonatingError', async ({ assert }) => {
    await assert.rejects(() => service.resolveImpersonator(undefined), NotImpersonatingError)
    await assert.rejects(() => service.resolveImpersonator(null), NotImpersonatingError)
    await assert.rejects(() => service.resolveImpersonator('abc'), NotImpersonatingError)
  })

  test('renvoie le super admin actif, null s’il a disparu, est désactivé ou rétrogradé', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const impersonator = await service.resolveImpersonator(superAdmin.id)
    assert.equal(impersonator?.id, superAdmin.id)
    assert.isNull(await service.resolveImpersonator(999999))

    const demoted = await createSuperAdmin()
    demoted.role = 'admin'
    await demoted.save()
    assert.isNull(await service.resolveImpersonator(demoted.id))

    const disabled = await createSuperAdmin()
    disabled.disabledAt = DateTime.now()
    await disabled.save()
    assert.isNull(await service.resolveImpersonator(disabled.id))
  })
})

test.group('ImpersonationService.bannerFor (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('nom du super admin pendant une prise d’identité, null sinon', async ({ assert }) => {
    const superAdmin = await createSuperAdmin()

    assert.deepEqual(await service.bannerFor(superAdmin.id), {
      impersonatorName: superAdmin.name,
    })
    assert.isNull(await service.bannerFor(undefined))
    assert.isNull(await service.bannerFor(999999))
  })
})
