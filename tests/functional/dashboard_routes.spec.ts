import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Mutations du dashboard conseiller (candidats, organisation, invitations) :
 * refus anonyme en JSON (401) et chemin nominal pour un conseiller connecté.
 *
 * `loginAs()` écrit directement dans la session (store mémoire en test) : plus
 * besoin de rejouer le formulaire de login ni de recopier les cookies.
 */
test.group('Dashboard routes (functional)', (group) => {
  // Pas de transaction globale ici : les handlers HTTP passent par d'autres
  // connexions du pool Postgres et ne la verraient pas (cf. tests/bootstrap.ts).
  group.each.setup(() => truncateDb())

  test('POST /dashboard/conseiller/employees returns 401 when unauthenticated', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/dashboard/conseiller/employees')
      .header('Accept', 'application/json')
      .json({ name: 'Test', email: 'test@example.com' })
      .redirects(0)

    response.assertStatus(401)
    assert.isNull(await Employee.findBy('email', 'test@example.com'))
  })

  test('POST /dashboard/conseiller/employees creates employee and redirects when authenticated', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const candidateEmail = 'new.candidate@example.com'

    const response = await client
      .post('/dashboard/conseiller/employees')
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json({ name: 'New Candidate', email: candidateEmail })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/conseiller/employees')

    const employees = await Employee.query().where('email', candidateEmail)
    assert.lengthOf(employees, 1)
    assert.equal(employees[0].advisorId, advisor.id)
    assert.equal(employees[0].organizationId, advisor.organizationId)
  })

  test('PUT /dashboard/conseiller/settings/organization returns 401 when unauthenticated', async ({
    client,
  }) => {
    const response = await client
      .put('/dashboard/conseiller/settings/organization')
      .header('Accept', 'application/json')
      .json({ name: 'My Org', slug: 'my-org' })
      .redirects(0)

    response.assertStatus(401)
  })

  test('PUT /dashboard/conseiller/settings/organization updates org and redirects when authenticated', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const newName = 'Updated Org'

    const response = await client
      .put('/dashboard/conseiller/settings/organization')
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json({ name: newName, slug: org.slug })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/conseiller/settings')

    await org.refresh()
    assert.equal(org.name, newName)
  })

  test('POST /dashboard/conseiller/settings/organization/advisors returns 401 when unauthenticated', async ({
    assert,
    client,
  }) => {
    const response = await client
      .post('/dashboard/conseiller/settings/organization/advisors')
      .header('Accept', 'application/json')
      .json({ name: 'New Advisor', email: 'advisor@example.com', role: 'consultant' })
      .redirects(0)

    response.assertStatus(401)
    assert.isNull(await User.findBy('email', 'advisor@example.com'))
  })

  test('POST /dashboard/conseiller/settings/organization/advisors invites advisor and redirects when authenticated', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()
    const invitedEmail = 'invited.advisor@example.com'

    const response = await client
      .post('/dashboard/conseiller/settings/organization/advisors')
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json({ name: 'Invited Advisor', email: invitedEmail, role: 'consultant' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/conseiller/settings')

    const invitedUser = await User.findBy('email', invitedEmail)
    assert.isNotNull(invitedUser)
    assert.equal(invitedUser!.name, 'Invited Advisor')
    assert.equal(invitedUser!.organizationId, advisor.organizationId)
  })
})
