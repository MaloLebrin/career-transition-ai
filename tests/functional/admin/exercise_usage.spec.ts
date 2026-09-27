import { EmployeeFactory } from '#database/factories/employee_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import type Organization from '#models/organization'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import { createAdmin, createOrganization, createSuperAdmin } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Usage des exercices, côté super admin :
 * GET /dashboard/super-admin/exercises-usage[/export]
 *
 * Les dates sont fixées (filtres from/to explicites) pour ne pas dépendre du jour.
 */
const USAGE = '/dashboard/super-admin/exercises-usage'
const RANGE = { from: '2030-01-01', to: '2030-01-31' }

type UsageOrg = {
  id: number
  name: string
  totalsByType: Record<string, number>
  totalExercises: number
}

async function seedResult(
  org: Organization,
  type: (typeof EXERCICE_RESULTS_TYPES)[keyof typeof EXERCICE_RESULTS_TYPES],
  date: string,
  status: 'completed' | 'draft' = exerciceResultStatusValues.COMPLETED
) {
  const employee = await EmployeeFactory.merge({ organizationId: org.id }).create()
  return ExerciseResultFactory.merge({
    employeeId: employee.id,
    type,
    status,
    date: DateTime.fromISO(date),
  }).create()
}

test.group('Super admin — usage des exercices', (group) => {
  group.each.setup(() => truncateDb())

  test('agrège les résultats terminés par organisation et type sur la période', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const alpha = await createOrganization()
    alpha.name = 'Alpha'
    await alpha.save()
    const beta = await createOrganization()
    beta.name = 'Beta'
    await beta.save()

    await seedResult(alpha, EXERCICE_RESULTS_TYPES.VALUES, '2030-01-05')
    await seedResult(alpha, EXERCICE_RESULTS_TYPES.VALUES, '2030-01-06')
    await seedResult(alpha, EXERCICE_RESULTS_TYPES.DISC, '2030-01-07')
    await seedResult(beta, EXERCICE_RESULTS_TYPES.DISC, '2030-01-31')
    // Hors période, brouillon : ignorés
    await seedResult(beta, EXERCICE_RESULTS_TYPES.DISC, '2030-02-01')
    await seedResult(beta, EXERCICE_RESULTS_TYPES.VALUES, '2030-01-10', 'draft')

    const response = await client.get(USAGE).qs(RANGE).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/exercises/Usage', [
      'filters',
      'organizations',
      'organizationsOptions',
    ])
    assert.deepEqual(props.filters, { ...RANGE, organizationId: null })
    assert.deepEqual(props.organizations as UsageOrg[], [
      {
        id: alpha.id,
        name: 'Alpha',
        totalsByType: { [EXERCICE_RESULTS_TYPES.VALUES]: 2, [EXERCICE_RESULTS_TYPES.DISC]: 1 },
        totalExercises: 3,
      },
      {
        id: beta.id,
        name: 'Beta',
        totalsByType: { [EXERCICE_RESULTS_TYPES.DISC]: 1 },
        totalExercises: 1,
      },
    ])
    const options = props.organizationsOptions as Array<{ id: number }>
    assert.includeMembers(
      options.map((o) => o.id),
      [alpha.id, beta.id]
    )
  })

  test('filtre sur une organisation', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const alpha = await createOrganization()
    const beta = await createOrganization()
    await seedResult(alpha, EXERCICE_RESULTS_TYPES.VALUES, '2030-01-05')
    await seedResult(beta, EXERCICE_RESULTS_TYPES.VALUES, '2030-01-05')

    const response = await client
      .get(USAGE)
      .qs({ ...RANGE, organizationId: String(beta.id) })
      .loginAs(superAdmin)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/exercises/Usage')
    assert.equal((props.filters as { organizationId: number }).organizationId, beta.id)
    assert.deepEqual(
      (props.organizations as UsageOrg[]).map((o) => o.id),
      [beta.id]
    )
  })

  test('sans filtre, la période par défaut couvre les 30 derniers jours', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client.get(USAGE).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/exercises/Usage')
    const filters = props.filters as { from: string; to: string }
    const days = DateTime.fromISO(filters.to).diff(DateTime.fromISO(filters.from), 'days').days
    assert.equal(days, 30)
  })

  test('exporte le CSV avec échappement des noms', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    org.name = 'Cabinet "Le Phare"'
    await org.save()
    await seedResult(org, EXERCICE_RESULTS_TYPES.MOTIVATION, '2030-01-15')

    const response = await client.get(`${USAGE}/export`).qs(RANGE).loginAs(superAdmin)

    response.assertStatus(200)
    assert.match(String(response.header('content-type')), /^text\/csv/)
    assert.equal(
      response.header('content-disposition'),
      'attachment; filename="exercises-usage-2030-01-01-to-2030-01-31.csv"'
    )
    assert.deepEqual(response.text().split('\n'), [
      'organization_id,organization_name,type,count',
      `${org.id},"Cabinet ""Le Phare""",${EXERCICE_RESULTS_TYPES.MOTIVATION},1`,
    ])
  })

  test('un admin est refusé sur la page et l’export (403)', async ({ client }) => {
    const admin = await createAdmin()

    for (const path of [USAGE, `${USAGE}/export`]) {
      const response = await client.get(path).loginAs(admin).redirects(0)
      response.assertStatus(403)
    }
  })
})
