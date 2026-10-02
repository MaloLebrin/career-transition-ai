import Employee from '#models/employee'
import { teamEmployeeScope } from '#services/team_employee_scope_service'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createEmployeeFor,
  createInHouseExpert,
  createPlatformOrganization,
  createUser,
} from '#tests/support/actors'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('teamEmployeeScope (M4)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const idsFor = async (user: Parameters<typeof teamEmployeeScope>[0]) => {
    const rows = await Employee.query().where(teamEmployeeScope(user)).orderBy('id')
    return rows.map((e) => e.id)
  }

  test('expert de la plateforme : seulement ses candidats assignés', async ({ assert }) => {
    const expert = await createInHouseExpert()
    const mine = await createB2cCandidate({ expert })
    await createB2cCandidate()
    const other = await createInHouseExpert()
    await createB2cCandidate({ expert: other })

    assert.deepEqual(await idsFor(expert), [mine.employee.id])
  })

  test('rôle expert de la plateforme : même cloisonnement', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const expert = await createUser(USERS_ROLES.EXPERT, platform)
    const mine = await createB2cCandidate({ expert })
    await createB2cCandidate()

    assert.deepEqual(await idsFor(expert), [mine.employee.id])
  })

  test('admin de la plateforme : toute l’organisation', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    const admin = await createAdmin(platform)
    const a = await createB2cCandidate()
    const b = await createB2cCandidate()

    assert.deepEqual(await idsFor(admin), [a.employee.id, b.employee.id])
  })

  test('conseiller d’un cabinet : toute son organisation, rien d’une autre', async ({ assert }) => {
    const advisor = await createAdvisor()
    const own = await createEmployeeFor(advisor)
    await createEmployeeFor(await createAdvisor())
    await createB2cCandidate()

    assert.deepEqual(await idsFor(advisor), [own.id])
  })
})
