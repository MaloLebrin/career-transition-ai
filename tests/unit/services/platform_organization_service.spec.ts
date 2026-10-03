import { PlatformOrganizationMissingError } from '#exceptions/platform_errors'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { createOrganization, createPlatformOrganization } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * #92 — l'organisation plateforme est identifiée par `is_platform`, jamais par
 * l'organisation du super admin connecté.
 */
test.group('PlatformOrganizationService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('get() renvoie l’organisation marquée is_platform, pas une autre', async ({ assert }) => {
    await createOrganization()
    const platform = await createPlatformOrganization()
    await createOrganization()

    const service = new PlatformOrganizationService()

    const found = await service.get()
    assert.equal(found.id, platform.id)
    assert.isTrue(found.isPlatform)
    assert.equal(await service.getId(), platform.id)
  })

  test('sans organisation plateforme : E_PLATFORM_ORGANIZATION_MISSING (503)', async ({
    assert,
  }) => {
    await createOrganization()
    const service = new PlatformOrganizationService()

    const error = await service.get().then(
      () => null,
      (err: unknown) => err
    )
    assert.instanceOf(error, PlatformOrganizationMissingError)
    assert.equal((error as PlatformOrganizationMissingError).status, 503)
    assert.equal(
      (error as PlatformOrganizationMissingError).code,
      'E_PLATFORM_ORGANIZATION_MISSING'
    )
  })
})
