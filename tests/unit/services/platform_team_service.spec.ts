import { PlatformOrganizationService } from '#services/platform_organization_service'
import { PlatformTeamService } from '#services/platform_team_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  createAdvisor,
  createB2cCandidate,
  createInHouseExpert,
  createPlatformOrganization,
  createSuperAdmin,
  createUser,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function makeService() {
  const invitations: unknown[] = []
  const users = new SuperAdminUsersService({
    sendSetPasswordLink: async (payload: unknown) => {
      invitations.push(payload)
    },
  } as any)
  return { invitations, service: new PlatformTeamService(new PlatformOrganizationService(), users) }
}

test.group('PlatformTeamService (#105)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('listMembers : advisor / expert / admin de la plateforme, triés, avec candidats suivis', async ({
    assert,
  }) => {
    const { service } = makeService()
    const platform = await createPlatformOrganization()
    await createSuperAdmin()
    const zoe = await createUser(USERS_ROLES.ADVISOR, platform, { name: 'Zoé' })
    const anna = await createUser(USERS_ROLES.ADMIN, platform, { name: 'Anna' })
    const deleted = await createUser(USERS_ROLES.EXPERT, platform, { name: 'Supprimé' })
    deleted.deletedAt = DateTime.now()
    await deleted.save()
    await createAdvisor() // cabinet client
    await createB2cCandidate({ paid: true, expert: zoe })

    const members = await service.listMembers()

    assert.deepEqual(
      members.map((m) => [m.name, m.role, m.assignedCandidatesCount]),
      [
        ['Anna', USERS_ROLES.ADMIN, 0],
        ['Zoé', USERS_ROLES.ADVISOR, 1],
      ]
    )
    assert.equal(members[0].id, anna.id)
    assert.isTrue(members[1].onboardingCompleted)
  })

  test('findEligibleExpert : membre interne seulement', async ({ assert }) => {
    const { service } = makeService()
    const expert = await createInHouseExpert()
    const clientAdvisor = await createAdvisor()
    const superAdmin = await createSuperAdmin()
    const b2c = await createB2cCandidate()

    const found = await service.findEligibleExpert(expert.id)
    assert.equal(found?.id, expert.id)
    assert.isNull(await service.findEligibleExpert(clientAdvisor.id))
    assert.isNull(await service.findEligibleExpert(superAdmin.id))
    assert.isNull(await service.findEligibleExpert(b2c.user.id))
    assert.isNull(await service.findEligibleExpert(999_999))
  })

  test('invite : crée le compte dans l’organisation plateforme et envoie le lien', async ({
    assert,
  }) => {
    const { service, invitations } = makeService()
    const platform = await createPlatformOrganization()

    const user = await service.invite({
      name: 'Nadia',
      email: 'nadia@plateforme.test',
      role: USERS_ROLES.ADVISOR,
    })

    assert.equal(user.organizationId, platform.id)
    assert.equal(user.role, USERS_ROLES.ADVISOR)
    assert.lengthOf(invitations, 1)
    assert.lengthOf(await service.listMembers(), 1)
  })
})
