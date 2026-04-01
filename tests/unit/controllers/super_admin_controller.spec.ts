import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import SuperAdminController from '#controllers/super_admin_controller'
import Organization from '#models/organization'
import ExerciseResult from '#models/exercise_result'
import Employee from '#models/employee'
import { DateTime } from 'luxon'

function makeCtx(overrides: any = {}) {
  const flashes: Record<string, any> = {}
  return {
    request: overrides.request ?? {
      qs: () => ({}),
    },
    response: {
      statusCode: 200,
    },
    inertia: {
      rendered: null as any,
      render(name: string, props: any) {
        this.rendered = { name, props }
        return this.rendered
      },
    },
    flashes,
    session: {
      flash(key: string, value: any) {
        flashes[key] = value
      },
    },
  } as any
}

test.group('SuperAdminController.exerciseUsage', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('aggregates exercise results per organization and type', async ({ assert }) => {
    const org1 = await Organization.create({
      name: 'Org A',
      slug: `org-a-${Date.now()}`,
    })
    const org2 = await Organization.create({
      name: 'Org B',
      slug: `org-b-${Date.now()}`,
    })

    const employee1 = await Employee.create({
      organizationId: org1.id,
      name: 'Emp 1',
      email: `emp1-${Date.now()}@test.example`,
      currentRole: 'Role 1',
      status: 'active',
    })
    const employee2 = await Employee.create({
      organizationId: org2.id,
      name: 'Emp 2',
      email: `emp2-${Date.now()}@test.example`,
      currentRole: 'Role 2',
      status: 'active',
    })

    const today = DateTime.now().toISODate()!

    await ExerciseResult.createMany([
      {
        employeeId: employee1.id,
        type: 'motivation',
        status: 'completed',
        date: DateTime.fromISO(today),
        duration: 10,
        data: {},
        quantitativeScore: null,
        qualitativeAnalysis: null,
      },
      {
        employeeId: employee1.id,
        type: 'values',
        status: 'completed',
        date: DateTime.fromISO(today),
        duration: 5,
        data: {},
        quantitativeScore: null,
        qualitativeAnalysis: null,
      },
      {
        employeeId: employee2.id,
        type: 'motivation',
        status: 'completed',
        date: DateTime.fromISO(today),
        duration: 8,
        data: {},
        quantitativeScore: null,
        qualitativeAnalysis: null,
      },
    ])

    const controller = new SuperAdminController()
    const ctx = makeCtx({
      request: {
        qs: () => ({
          from: today,
          to: today,
        }),
      },
    })

    // @ts-expect-error minimal context
    await controller.exerciseUsage(ctx)

    const rendered = ctx.inertia.rendered
    assert.equal(rendered.name, 'dashboard/admin/exercises/Usage')
    const organizations = rendered.props.organizations as any[]

    const orgA = organizations.find((o) => o.name === 'Org A')
    const orgB = organizations.find((o) => o.name === 'Org B')

    assert.exists(orgA)
    assert.exists(orgB)
    assert.equal(orgA.totalExercises, 2)
    assert.equal(orgA.totalsByType.motivation, 1)
    assert.equal(orgA.totalsByType.values, 1)
    assert.equal(orgB.totalExercises, 1)
    assert.equal(orgB.totalsByType.motivation, 1)
  })
})

test.group('SuperAdminController.exerciseUsageExport', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('returns CSV export for super admin', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org CSV',
      slug: `org-csv-${Date.now()}`,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      name: 'Emp CSV',
      email: `emp-csv-${Date.now()}@test.example`,
      currentRole: 'Role CSV',
      status: 'active',
    })

    const today = DateTime.now().toISODate()!

    await ExerciseResult.create({
      employeeId: employee.id,
      type: 'motivation',
      status: 'completed',
      date: DateTime.fromISO(today),
      duration: 10,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    })

    const controller = new SuperAdminController()
    const bodyChunks: any[] = []

    const ctx = {
      auth: { user: { id: 1, role: 'super_admin' as const } },
      request: {
        qs: () => ({
          from: today,
          to: today,
        }),
      },
      response: {
        statusCode: 200,
        headers: {} as Record<string, string>,
        header(key: string, value: string) {
          this.headers[key.toLowerCase()] = value
        },
        send(payload: any) {
          bodyChunks.push(payload)
          return payload
        },
      },
    } as any

    // @ts-expect-error minimal context
    const result = await controller.exerciseUsageExport(ctx)

    const csv = String(result || bodyChunks.join(''))
    assert.include(csv, 'organization_id,organization_name,type,count')
    assert.include(csv, 'Org CSV')
    assert.include(csv, 'motivation')
  })
})
