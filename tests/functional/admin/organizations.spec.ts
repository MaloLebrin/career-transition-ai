import Organization from '#models/organization'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import {
  createAdmin,
  createAdvisor,
  createEmployeeFor,
  createOrganization,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Organisations clientes, côté super admin :
 * GET/POST /dashboard/super-admin/organizations, DELETE /dashboard/super-admin/organizations/:id
 */
const ORGS = '/dashboard/super-admin/organizations'

type OrgItem = { id: number; usersCount: number; employeesCount: number }

test.group('Super admin — organisations : liste', (group) => {
  group.each.setup(() => truncateDb())

  test('liste les organisations clientes avec leurs compteurs, hors organisation plateforme', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    await createAdmin(org)
    await createEmployeeFor(advisor)
    const empty = await createOrganization()

    const response = await client.get(ORGS).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/organizations/Index', [
      'organizations',
    ])
    const items = props.organizations as OrgItem[]
    assert.sameMembers(
      items.map((o) => o.id),
      [org.id, empty.id]
    )
    assert.include(items.find((o) => o.id === org.id)!, { usersCount: 2, employeesCount: 1 })
    assert.include(items.find((o) => o.id === empty.id)!, { usersCount: 0, employeesCount: 0 })
  })
})

test.group('Super admin — organisations : création', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('crée l’organisation, son propriétaire admin et envoie le lien', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(ORGS)
      .json({ name: 'Cabinet Nord', ownerName: 'Olivia Owner', ownerEmail: 'olivia@example.com' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', ORGS)
    assert.equal(
      response.flashMessage('success'),
      'Organisation créée. Email envoyé au propriétaire pour créer son mot de passe.'
    )

    const org = await Organization.findByOrFail('name', 'Cabinet Nord')
    assert.equal(org.slug, 'cabinet-nord')
    const owner = await User.findByOrFail('email', 'olivia@example.com')
    assert.equal(owner.organizationId, org.id)
    assert.equal(owner.role, USERS_ROLES.ADMIN)
    const token = await OnboardingToken.query().where('userId', owner.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['olivia@example.com'])
    assert.include(mails.sent[0].text ?? '', `/onboarding/${token.token}`)
  })

  test('refuse un email propriétaire déjà utilisé (flash error)', async ({
    client,
    assert,
    db,
  }) => {
    const superAdmin = await createSuperAdmin()
    const existing = await createAdvisor()

    const response = await client
      .post(ORGS)
      .header('referer', ORGS)
      .json({ name: 'Cabinet Sud', ownerName: 'X', ownerEmail: existing.email.toUpperCase() })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', ORGS)
    assert.equal(response.flashMessage('error'), 'Cet email est déjà utilisé.')
    await db.assertMissing('organizations', { name: 'Cabinet Sud' })
    assert.deepEqual(mails.sent, [])
  })

  test('refuse un nom d’organisation déjà pris (flash error)', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const taken = await createOrganization()

    const response = await client
      .post(ORGS)
      .json({ name: taken.name, ownerName: 'X', ownerEmail: 'nouveau@example.com' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('error'), 'Une organisation avec ce nom existe déjà.')
    const count = await Organization.query().where('name', taken.name).count('* as n')
    assert.equal(Number(count[0].$extras.n), 1)
    assert.isNull(await User.findBy('email', 'nouveau@example.com'))
  })

  test('en JSON, une erreur métier répond 409 avec le message', async ({ client }) => {
    const superAdmin = await createSuperAdmin()
    const taken = await createOrganization()

    const response = await client
      .post(ORGS)
      .header('Accept', 'application/json')
      .json({ name: taken.name, ownerName: 'X', ownerEmail: 'nouveau@example.com' })
      .loginAs(superAdmin)
      .redirects(0)

    response.assertStatus(409)
    response.assertBody({ message: 'Une organisation avec ce nom existe déjà.' })
  })

  test('rejette les champs obligatoires manquants', async ({ client, assert, db }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(ORGS)
      .json({ ownerEmail: 'pas-un-email' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['name', 'ownerName', 'ownerEmail'])
    await db.assertCount('organizations', 1)
  })

  test('un admin ne peut pas créer d’organisation (403)', async ({ client, db }) => {
    const admin = await createAdmin()

    const response = await client
      .post(ORGS)
      .json({ name: 'Pirate', ownerName: 'X', ownerEmail: 'pirate@example.com' })
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(403)
    await db.assertMissing('organizations', { name: 'Pirate' })
  })
})

test.group('Super admin — organisations : suppression', (group) => {
  group.each.setup(() => truncateDb())

  test('supprime une organisation vide', async ({ client, assert, db }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()

    const response = await client
      .delete(`${ORGS}/${org.id}`)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', ORGS)
    assert.equal(response.flashMessage('success'), 'Organisation supprimée.')
    await db.assertMissing('organizations', { id: org.id })
  })

  test('une organisation inconnue renvoie un flash d’erreur', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .delete(`${ORGS}/999999`)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', ORGS)
    assert.equal(response.flashMessage('error'), 'Organisation introuvable.')
  })

  test('un admin ne peut pas supprimer d’organisation (403)', async ({ client, db }) => {
    const admin = await createAdmin()
    const org = await createOrganization()

    const response = await client.delete(`${ORGS}/${org.id}`).loginAs(admin).redirects(0)

    response.assertStatus(403)
    await db.assertHas('organizations', { id: org.id })
  })
})
