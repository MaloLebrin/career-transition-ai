import { makeEntitlements } from '#tests/support/entitlements'
import AdminSeeder from '#database/seeders/admin_seeder'
import B2cCandidateSeeder, { B2C_SEED_ACCOUNTS } from '#database/seeders/b2c_candidate_seeder'
import Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import User from '#models/user'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { EXPERT_REQUEST_STATUSES } from '#shared/constants/expert_request'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { overrideEnv } from '#tests/utils/env'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('B2cCandidateSeeder (#94)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sans organisation plateforme : ne fait rien', async ({ assert }) => {
    await new B2cCandidateSeeder(db.connection()).run()

    assert.isNull(await User.findBy('email', B2C_SEED_ACCOUNTS.expert))
  })

  test('crée un expert interne, un particulier gratuit et un particulier au forfait, de façon idempotente', async ({
    assert,
    cleanup,
  }) => {
    cleanup(overrideEnv({ ADMIN_PASSWORD: 'b2c-seeder-spec-password' }))
    const client = db.connection()
    await new AdminSeeder(client).run()
    await new B2cCandidateSeeder(client).run()
    await new B2cCandidateSeeder(client).run()

    const expert = await User.findByOrFail('email', B2C_SEED_ACCOUNTS.expert)
    assert.equal(expert.role, USERS_ROLES.ADVISOR)

    const unpaid = await Employee.findByOrFail('email', B2C_SEED_ACCOUNTS.unpaid)
    const paid = await Employee.findByOrFail('email', B2C_SEED_ACCOUNTS.paid)
    for (const employee of [unpaid, paid]) {
      assert.equal(employee.accountType, ACCOUNT_TYPES.B2C)
      assert.equal(employee.organizationId, expert.organizationId)
      assert.isNull(employee.advisorId)
      assert.isNotNull(employee.userId)
    }

    const service = makeEntitlements()
    assert.isFalse(await service.hasResultsAccess(unpaid.id))
    assert.isTrue(await service.hasResultsAccess(paid.id))
    assert.lengthOf(await Employee.query().where('email', B2C_SEED_ACCOUNTS.paid), 1)

    // #103 : une seule demande d'accompagnement en attente pour le particulier au forfait.
    const requests = await ExpertRequest.query().where('employeeId', paid.id)
    assert.lengthOf(requests, 1)
    assert.equal(requests[0].status, EXPERT_REQUEST_STATUSES.PENDING)
    assert.lengthOf(await ExpertRequest.query().where('employeeId', unpaid.id), 0)
  })
})
