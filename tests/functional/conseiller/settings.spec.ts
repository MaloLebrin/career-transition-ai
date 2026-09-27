import Organization from '#models/organization'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdmin, createAdvisor, createCandidate, createUser } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { fakeMail, type RecordingMailProvider, restoreMail } from './helpers.js'

/**
 * Paramètres du cabinet : /dashboard/conseiller/settings[/organization[/advisors]]
 */
const SETTINGS = '/dashboard/conseiller/settings'

test.group('Conseiller — paramètres : page', (group) => {
  group.each.setup(() => truncateDb())

  test('expose le cabinet et ses conseillers/admins uniquement', async ({ client, assert }) => {
    const admin = await createAdmin()
    const org = await Organization.findOrFail(admin.organizationId)
    const advisor = await createAdvisor(org)
    await createCandidate({ organization: org })
    await createAdvisor()

    const response = await client.get(SETTINGS).loginAs(admin).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/settings/Home', [
      'organization',
      'members',
    ])
    assert.equal((props.organization as { id: number }).id, org.id)
    const members = props.members as Array<{ id: number; role: string }>
    assert.sameMembers(
      members.map((m) => m.id),
      [admin.id, advisor.id]
    )
    assert.equal(members.find((m) => m.id === admin.id)!.role, 'admin')
    assert.equal(members.find((m) => m.id === advisor.id)!.role, 'expert')
  })

  test('un candidat est refusé (403)', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.get(SETTINGS).loginAs(user).redirects(0)

    response.assertStatus(403)
  })
})

test.group('Conseiller — paramètres : cabinet', (group) => {
  group.each.setup(() => truncateDb())

  test('met à jour le cabinet de l’utilisateur connecté', async ({ client, assert }) => {
    const admin = await createAdmin()
    const other = await createAdmin()

    const response = await client
      .put(`${SETTINGS}/organization`)
      .json({ name: 'Cabinet Horizon', logoUrl: 'https://cdn.example.com/logo.png' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', SETTINGS)
    assert.equal(response.flashMessage('success'), 'Cabinet mis à jour.')

    const org = await Organization.findOrFail(admin.organizationId)
    assert.equal(org.name, 'Cabinet Horizon')
    assert.equal(org.logoUrl, 'https://cdn.example.com/logo.png')

    const untouched = await Organization.findOrFail(other.organizationId)
    assert.notEqual(untouched.name, 'Cabinet Horizon')
  })

  test('renommer régénère le slug, sauf slug explicite', async ({ client, assert }) => {
    const admin = await createAdmin()

    await client
      .put(`${SETTINGS}/organization`)
      .json({ name: 'Cabinet Atlas' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    let org = await Organization.findOrFail(admin.organizationId)
    assert.equal(org.name, 'Cabinet Atlas')
    assert.equal(org.slug, 'cabinet-atlas')

    await client
      .put(`${SETTINGS}/organization`)
      .json({ name: 'Cabinet Boréal', slug: 'boreal' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    org = await Organization.findOrFail(admin.organizationId)
    assert.equal(org.slug, 'boreal')
  })

  test('rejette un nom trop long', async ({ client, assert }) => {
    const admin = await createAdmin()
    const before = await Organization.findOrFail(admin.organizationId)

    const response = await client
      .put(`${SETTINGS}/organization`)
      .json({ name: 'x'.repeat(256) })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.deepEqual(Object.keys(inertiaErrors(response)), ['name'])
    const after = await Organization.findOrFail(admin.organizationId)
    assert.equal(after.name, before.name)
  })
})

test.group('Conseiller — paramètres : invitation de collaborateurs', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('invite un admin dans son cabinet et lui envoie le lien', async ({ client, assert }) => {
    const admin = await createAdmin()

    const response = await client
      .post(`${SETTINGS}/organization/advisors`)
      .json({ name: 'Nina Admin', email: 'nina@example.com', role: 'admin' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', SETTINGS)
    assert.equal(response.flashMessage('success'), 'Collaborateur invité.')

    const invited = await User.findByOrFail('email', 'nina@example.com')
    assert.equal(invited.organizationId, admin.organizationId)
    assert.equal(invited.role, USERS_ROLES.ADMIN)
    const token = await OnboardingToken.query().where('userId', invited.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['nina@example.com'])
    assert.include(mails.sent[0].text ?? '', `/onboarding/${token.token}`)
  })

  test('les rôles expert et consultant deviennent des conseillers', async ({ client, assert }) => {
    const admin = await createAdmin()

    for (const [email, role] of [
      ['expert@example.com', 'expert'],
      ['consultant@example.com', 'consultant'],
    ]) {
      await client
        .post(`${SETTINGS}/organization/advisors`)
        .json({ name: role, email, role })
        .loginAs(admin)
        .withInertia()
        .redirects(0)
      const invited = await User.findByOrFail('email', email)
      assert.equal(invited.role, USERS_ROLES.ADVISOR, role)
    }
  })

  test('refuse un email déjà présent dans le cabinet (flash error)', async ({ client, assert }) => {
    const admin = await createAdmin()
    const org = await Organization.findOrFail(admin.organizationId)
    const existing = await createUser(USERS_ROLES.ADVISOR, org, { email: 'deja@example.com' })

    const response = await client
      .post(`${SETTINGS}/organization/advisors`)
      .json({ name: 'Doublon', email: 'DEJA@example.com', role: 'expert' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', SETTINGS)
    assert.equal(
      response.flashMessage('error'),
      'Cet email est déjà utilisé par un compte existant.'
    )
    const count = await User.query().whereRaw('LOWER(email) = ?', [existing.email]).count('* as n')
    assert.equal(Number(count[0].$extras.n), 1)
    assert.deepEqual(mails.sent, [])
  })

  test('rejette un rôle inconnu (super_admin) et un email invalide', async ({
    client,
    assert,
    db,
  }) => {
    const admin = await createAdmin()

    const response = await client
      .post(`${SETTINGS}/organization/advisors`)
      .json({ name: 'Pirate', email: 'nope', role: 'super_admin' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'role'])
    await db.assertCount('users', 1)
    assert.deepEqual(mails.sent, [])
  })
})
