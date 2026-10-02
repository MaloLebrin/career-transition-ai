import { createB2cCandidate, createInHouseExpert } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Cloisonnement de l'équipe plateforme (revue PR #109, M4) : dans l'organisation
 * plateforme, un expert ou conseiller n'accède qu'aux particuliers qui lui sont
 * assignés ; les autres répondent 404.
 */
test.group('Équipe plateforme — candidats B2C non assignés', (group) => {
  group.each.setup(() => truncateDb())

  const paths = (id: number) => [
    `/dashboard/conseiller/employees/${id}/profile`,
    `/dashboard/conseiller/employees/${id}/synthesis`,
  ]

  test('expert non assigné → 404 sur profil et synthèse, redirection sur les exercices', async ({
    client,
  }) => {
    const expert = await createInHouseExpert()
    const { employee } = await createB2cCandidate({ paid: true })

    for (const path of paths(employee.id)) {
      const response = await client.get(path).loginAs(expert).withInertia().redirects(0)
      response.assertStatus(404)
    }
    const exercises = await client
      .get(`/dashboard/conseiller/employees/${employee.id}/exercises`)
      .loginAs(expert)
      .withInertia()
      .redirects(0)
    exercises.assertStatus(302)
    exercises.assertHeader('location', '/dashboard/conseiller/employees')
  })

  test('expert assigné → accès au profil et à la synthèse', async ({ client }) => {
    const expert = await createInHouseExpert()
    const { employee } = await createB2cCandidate({ paid: true, expert })

    for (const path of paths(employee.id)) {
      const response = await client.get(path).loginAs(expert).withInertia().redirects(0)
      response.assertStatus(200)
    }
  })

  test('expert non assigné : écriture de synthèse refusée (404)', async ({ client }) => {
    const expert = await createInHouseExpert()
    const { employee } = await createB2cCandidate({ paid: true })

    const response = await client
      .put(`/dashboard/conseiller/employees/${employee.id}/synthesis`)
      .loginAs(expert)
      .withInertia()
      .redirects(0)

    response.assertStatus(404)
  })
})
