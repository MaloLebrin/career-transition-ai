import Organization from '#models/organization'
import { OrganizationFactory } from '#database/factories/organization_factory'
import { createPlatformOrganization } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/** #92 — `organizations.is_platform` : faux par défaut, une seule organisation plateforme. */
test.group('Organization — is_platform', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une organisation cliente n’est pas la plateforme par défaut', async ({ assert }) => {
    const organization = await OrganizationFactory.create()
    await organization.refresh()

    assert.isFalse(organization.isPlatform)
  })

  test('une seule organisation plateforme possible (index unique partiel)', async ({ assert }) => {
    await createPlatformOrganization()

    await assert.rejects(
      () => OrganizationFactory.merge({ isPlatform: true }).create(),
      /organizations_single_platform_unique/
    )
  })

  test('plusieurs organisations non plateforme coexistent', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const clients = await OrganizationFactory.createMany(2)

    const rows = await Organization.query().whereIn('id', [
      platform.id,
      ...clients.map((c) => c.id),
    ])
    assert.lengthOf(rows, 3)
    assert.lengthOf(
      rows.filter((row) => row.isPlatform),
      1
    )
  })
})
