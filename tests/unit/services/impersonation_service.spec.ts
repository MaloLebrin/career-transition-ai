import { ImpersonationNotAllowedError, NotImpersonatingError } from '#exceptions/auth_errors'
import { ImpersonationService, impersonationSession } from '#services/impersonation_service'
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

  test('aucune prise d’identité sur le compte connecté : NotImpersonatingError', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()
    const other = await createAdvisor()

    for (const raw of [undefined, null, 'abc', superAdmin.id, { impersonatorId: 'x' }]) {
      await assert.rejects(() => service.resolveImpersonator(raw, target), NotImpersonatingError)
    }
    // Clé restée en session pour un autre compte : jamais honorée.
    await assert.rejects(
      () => service.resolveImpersonator(impersonationSession(superAdmin, target), other),
      NotImpersonatingError
    )
  })

  test('renvoie le super admin actif, null s’il a disparu, est désactivé ou rétrogradé', async ({
    assert,
  }) => {
    const target = await createAdvisor()
    const superAdmin = await createSuperAdmin()
    const impersonator = await service.resolveImpersonator(
      impersonationSession(superAdmin, target),
      target
    )
    assert.equal(impersonator?.id, superAdmin.id)
    assert.isNull(
      await service.resolveImpersonator({ impersonatorId: 999999, targetId: target.id }, target)
    )

    const demoted = await createSuperAdmin()
    demoted.role = 'admin'
    await demoted.save()
    assert.isNull(await service.resolveImpersonator(impersonationSession(demoted, target), target))

    const disabled = await createSuperAdmin()
    disabled.disabledAt = DateTime.now()
    await disabled.save()
    assert.isNull(await service.resolveImpersonator(impersonationSession(disabled, target), target))
  })
})

test.group('ImpersonationService.bannerFor (#143)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('nom du super admin pendant une prise d’identité du compte connecté, null sinon', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()
    const raw = impersonationSession(superAdmin, target)

    assert.deepEqual(await service.bannerFor(raw, target), {
      impersonatorName: superAdmin.name,
    })
    assert.isNull(await service.bannerFor(undefined, target))
    assert.isNull(await service.bannerFor({ impersonatorId: 999999, targetId: target.id }, target))
    // Clé orpheline lue par une autre session (ou par le super admin lui-même) : pas de bandeau.
    assert.isNull(await service.bannerFor(raw, superAdmin))
  })
})
