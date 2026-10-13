import { EmployeeFactory } from '#database/factories/employee_factory'
import {
  AdvisorLicenseLimitReachedError,
  TeamMemberLockedError,
  TeamMemberNotFoundError,
  TeamReassignTargetInvalidError,
} from '#exceptions/team_errors'
import Employee from '#models/employee'
import { TeamMembersService } from '#services/team_members_service'
import { MAX_LICENSES_ADVISORS } from '#shared/constants/organisation'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createOrganization,
  createPlatformOrganization,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

async function orgOf(user: { related: (r: 'organization') => any }) {
  const organization = await user.related('organization').query().firstOrFail()
  return organization
}

test.group('TeamMembersService — licences (#71)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new TeamMembersService()

  test('countAdvisorSeats : admins et conseillers actifs, ni candidats ni désactivés', async ({
    assert,
  }) => {
    const org = await createOrganization()
    await createAdmin(org)
    const off = await createAdvisor(org)
    await off.merge({ disabledAt: DateTime.now() }).save()
    await createCandidate({ organization: org })

    assert.equal(await service.countAdvisorSeats(org.id), 1)
  })

  test('assertAdvisorSeatAvailable : refuse à la limite, ignore la plateforme', async ({
    assert,
  }) => {
    const org = await createOrganization()
    await service.assertAdvisorSeatAvailable(org.id)
    for (let i = 0; i < MAX_LICENSES_ADVISORS; i++) await createAdvisor(org)
    await assert.rejects(
      () => service.assertAdvisorSeatAvailable(org.id),
      AdvisorLicenseLimitReachedError
    )

    const platform = await createPlatformOrganization()
    for (let i = 0; i < MAX_LICENSES_ADVISORS + 1; i++) await createAdvisor(platform)
    await service.assertAdvisorSeatAvailable(platform.id)
  })
})

test.group('TeamMembersService — rôle, accès, réassignation (#71)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new TeamMembersService()

  test('changeRole : promeut un conseiller ; soi-même, autre cabinet ou candidat → refus', async ({
    assert,
  }) => {
    const admin = await createAdmin()
    const member = await createAdvisor(await orgOf(admin))
    const foreign = await createAdvisor()
    const candidate = await createCandidate({ organization: await orgOf(admin) })

    await service.changeRole(admin, member.id, 'admin')
    await member.refresh()
    assert.equal(member.role, USERS_ROLES.ADMIN)

    await assert.rejects(
      () => service.changeRole(admin, admin.id, 'advisor'),
      TeamMemberLockedError
    )
    await assert.rejects(
      () => service.changeRole(admin, foreign.id, 'admin'),
      TeamMemberNotFoundError
    )
    await assert.rejects(
      () => service.changeRole(admin, candidate.user.id, 'admin'),
      TeamMemberNotFoundError
    )
  })

  test('changeRole : le dernier administrateur actif ne peut pas être rétrogradé', async ({
    assert,
  }) => {
    const organization = await createOrganization()
    const onlyAdmin = await createAdmin(organization)
    // Garde de défense : l'appelant n'est pas lui-même un administrateur actif du cabinet.
    const caller = await createAdvisor(organization)

    await assert.rejects(
      () => service.changeRole(caller, onlyAdmin.id, 'advisor'),
      TeamMemberLockedError
    )
    await onlyAdmin.refresh()
    assert.equal(onlyAdmin.role, USERS_ROLES.ADMIN)

    const second = await createAdmin(organization)
    await service.changeRole(caller, onlyAdmin.id, 'advisor')
    await onlyAdmin.refresh()
    assert.equal(onlyAdmin.role, USERS_ROLES.ADVISOR)
    await second.refresh()
    assert.equal(second.role, USERS_ROLES.ADMIN)
  })

  test('setDisabled : coupe puis rétablit l’accès ; réactiver reprend une licence', async ({
    assert,
  }) => {
    const admin = await createAdmin()
    const organization = await orgOf(admin)
    const member = await createAdvisor(organization)

    await service.setDisabled(admin, member.id, true)
    await member.refresh()
    assert.isNotNull(member.disabledAt)

    const replacement = await createAdvisor(organization)
    await assert.rejects(
      () => service.setDisabled(admin, member.id, false),
      AdvisorLicenseLimitReachedError
    )
    await replacement.merge({ disabledAt: DateTime.now() }).save()
    await service.setDisabled(admin, member.id, false)
    await member.refresh()
    assert.isNull(member.disabledAt)
  })

  test('setDisabled : refuse soi-même et le dernier administrateur actif', async ({ assert }) => {
    const organization = await createOrganization()
    const onlyAdmin = await createAdmin(organization)
    const caller = await createAdvisor(organization)

    await assert.rejects(
      () => service.setDisabled(onlyAdmin, onlyAdmin.id, true),
      TeamMemberLockedError
    )
    await assert.rejects(
      () => service.setDisabled(caller, onlyAdmin.id, true),
      TeamMemberLockedError
    )
    await onlyAdmin.refresh()
    assert.isNull(onlyAdmin.disabledAt)
  })

  test('reassignCandidates : déplace les fiches de la source vers un membre actif du cabinet', async ({
    assert,
  }) => {
    const admin = await createAdmin()
    const organization = await orgOf(admin)
    const from = await createAdvisor(organization)
    const toUser = await createAdmin(organization)
    const other = await createAdvisor()
    const mine = await EmployeeFactory.merge({
      organizationId: organization.id,
      advisorId: from.id,
    }).createMany(2)
    const untouched = await EmployeeFactory.merge({
      organizationId: organization.id,
      advisorId: toUser.id,
    }).create()

    const moved = await service.reassignCandidates(admin, from.id, toUser.id)

    assert.equal(moved, 2)
    for (const e of mine) {
      const reloaded = await Employee.findOrFail(e.id)
      assert.equal(reloaded.advisorId, toUser.id)
    }
    const stay = await Employee.findOrFail(untouched.id)
    assert.equal(stay.advisorId, toUser.id)
    await assert.rejects(
      () => service.reassignCandidates(admin, from.id, from.id),
      TeamReassignTargetInvalidError
    )
    await assert.rejects(
      () => service.reassignCandidates(admin, from.id, other.id),
      TeamReassignTargetInvalidError
    )
    await toUser.merge({ disabledAt: DateTime.now() }).save()
    await assert.rejects(
      () => service.reassignCandidates(admin, from.id, toUser.id),
      TeamReassignTargetInvalidError
    )
  })
})
