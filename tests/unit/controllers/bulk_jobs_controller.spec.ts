import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import BulkJobsController from '#controllers/bulk_jobs_controller'
import BulkJob, { BULK_JOB_SCOPES, BULK_JOB_STATUSES, BULK_JOB_TYPES } from '#models/bulk_job'
import Organization from '#models/organization'
import User, { USERS_ROLES } from '#models/user'
import { QueueManager } from '@adonisjs/queue'
import SendBulkEmails from '#jobs/send_bulk_emails'

function makeResponse() {
  return {
    statusCode: 200,
    body: null as any,
    unauthorizedCalled: false,
    forbiddenCalled: false,
    notFoundCalled: false,
    created(payload: any) {
      this.statusCode = 201
      this.body = payload
      return this
    },
    json(payload: any) {
      this.body = payload
      return this
    },
    unauthorized() {
      this.unauthorizedCalled = true
      this.statusCode = 401
      return this
    },
    forbidden() {
      this.forbiddenCalled = true
      this.statusCode = 403
      return this
    },
    notFound() {
      this.notFoundCalled = true
      this.statusCode = 404
      return this
    },
  }
}

test.group('BulkJobsController.storeEmails', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => {
    QueueManager.restore()
  })
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const controller = new BulkJobsController()
    const response = makeResponse()

    await controller.storeEmails({
      auth: { user: null },
      request: { body: () => ({}) } as any,
      response: response as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
  })

  test('creates a bulk job for org and returns DTO for super admin', async ({ assert }) => {
    const fake = QueueManager.fake()
    const org = await Organization.create({
      name: 'Bulk Org',
      slug: `bulk-org-${Date.now()}`,
      logoUrl: null,
    })

    const user = await User.create({
      organizationId: org.id,
      email: `bulk-admin-${Date.now()}@example.com`,
      password: 'password',
      name: 'Bulk Admin',
      role: USERS_ROLES.SUPER_ADMIN,
    })

    const controller = new BulkJobsController()
    const response = makeResponse()

    await controller.storeEmails({
      auth: { user },
      request: {
        body: () => ({
          employeeIds: [],
          template: 'test-template',
        }),
      } as any,
      response: response as any,
    } as any)

    assert.equal(response.statusCode, 201)
    const dto = response.body
    assert.isDefined(dto.id)
    assert.equal(dto.userId, user.id)
    assert.equal(dto.organizationId, org.id)
    assert.equal(dto.type, BULK_JOB_TYPES.EMAILS)
    assert.equal(dto.scope, BULK_JOB_SCOPES.ORG)
    assert.equal(dto.status, BULK_JOB_STATUSES.PENDING)

    const job = await BulkJob.find(dto.id)
    assert.isNotNull(job)
    assert.equal(job!.type, BULK_JOB_TYPES.EMAILS)
    assert.equal(job!.scope, BULK_JOB_SCOPES.ORG)
    assert.equal(job!.status, BULK_JOB_STATUSES.PENDING)

    fake.assertPushed(SendBulkEmails, {
      payload: { bulkJobId: dto.id },
      queue: 'emails',
    })
  })
})
