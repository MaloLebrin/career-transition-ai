import Organization from '#models/organization'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdmin, createAdvisor, createCandidate, createUser } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
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

  test('met à jour le cabinet de l’utilisateur connecté (logoUrl libre ignoré)', async ({
    client,
    assert,
  }) => {
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
    assert.isNull(org.logoUrl, 'le logo passe par l’upload Cloudinary')

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

async function logoPublicIdOf(user: { organizationId: number }): Promise<string> {
  const org = await Organization.findOrFail(user.organizationId)
  return org.logoPublicId!
}

test.group('Conseiller — paramètres : logo du cabinet', (group) => {
  const LOGO = `${SETTINGS}/organization/logo`
  // PNG 1×1 valide : le bodyparser détecte le type réel du fichier.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  let cloud: FakeCloudinary

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('uploade le logo de son cabinet (image publique)', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const other = await createAdmin()

    const response = await client
      .post(LOGO)
      .file('logo', PNG, { filename: 'logo.png' })
      .loginAs(advisor)
      .withInertia()
      .header('referer', SETTINGS)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', SETTINGS)
    assert.equal(response.flashMessage('success'), 'Logo mis à jour.')

    const org = await Organization.findOrFail(advisor.organizationId)
    assert.match(org.logoPublicId!, new RegExp(`/organizations/${org.id}/logo/logo_`))
    assert.include(org.logoUrl!, org.logoPublicId!)
    assert.deepEqual(cloud.uploaded, [
      { publicId: org.logoPublicId!, resourceType: 'image', deliveryType: 'upload' },
    ])

    const untouched = await Organization.findOrFail(other.organizationId)
    assert.isNull(untouched.logoUrl)
  })

  test('remplacer le logo supprime l’ancien fichier', async ({ client, assert }) => {
    const admin = await createAdmin()
    const upload = () =>
      client.post(LOGO).file('logo', PNG, { filename: 'logo.png' }).loginAs(admin).redirects(0)

    await upload()
    const first = await logoPublicIdOf(admin)
    await upload()

    const org = await Organization.findOrFail(admin.organizationId)
    assert.notEqual(org.logoPublicId, first)
    assert.isFalse(cloud.has(first))
    assert.deepEqual([...cloud.files.keys()], [org.logoPublicId])
  })

  test('supprime le logo', async ({ client, assert }) => {
    const admin = await createAdmin()
    await client.post(LOGO).file('logo', PNG, { filename: 'logo.png' }).loginAs(admin)
    const publicId = await logoPublicIdOf(admin)

    const response = await client
      .delete(LOGO)
      .loginAs(admin)
      .withInertia()
      .header('referer', SETTINGS)
      .redirects(0)

    response.assertStatus(303) // Inertia : 303 après un DELETE
    assert.equal(response.flashMessage('success'), 'Logo supprimé.')
    const org = await Organization.findOrFail(admin.organizationId)
    assert.isNull(org.logoUrl)
    assert.isNull(org.logoPublicId)
    assert.isFalse(cloud.has(publicId))
  })

  test('ne touche jamais au logo d’un autre cabinet', async ({ client, assert }) => {
    const owner = await createAdmin()
    await client.post(LOGO).file('logo', PNG, { filename: 'logo.png' }).loginAs(owner)
    const ownerLogo = await logoPublicIdOf(owner)
    const intruder = await createAdvisor()

    await client.delete(LOGO).loginAs(intruder).redirects(0)

    const org = await Organization.findOrFail(owner.organizationId)
    assert.equal(org.logoPublicId, ownerLogo)
    assert.isTrue(cloud.has(ownerLogo))
  })

  test('refuse un type non image et un fichier trop lourd', async ({ client, assert }) => {
    const admin = await createAdmin()

    const wrongType = await client
      .post(LOGO)
      .file('logo', Buffer.from('%PDF-1.4'), { filename: 'logo.pdf' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)
    assertFieldErrors(assert, wrongType, ['logo'])

    const tooLarge = await client
      .post(LOGO)
      .file('logo', Buffer.alloc(2 * 1024 * 1024 + 1), { filename: 'logo.png' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)
    assertFieldErrors(assert, tooLarge, ['logo'])

    assert.deepEqual(cloud.uploaded, [])
    const org = await Organization.findOrFail(admin.organizationId)
    assert.isNull(org.logoUrl)
  })

  test('un candidat est refusé (403)', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(LOGO)
      .file('logo', PNG, { filename: 'logo.png' })
      .loginAs(user)
      .redirects(0)

    response.assertStatus(403)
    assert.deepEqual(cloud.uploaded, [])
  })
})

test.group('En-têtes de sécurité', (group) => {
  group.each.setup(() => truncateDb())

  test('Referrer-Policy sur les pages (le logo est servi par Cloudinary)', async ({ client }) => {
    const admin = await createAdmin()

    const response = await client.get(SETTINGS).loginAs(admin)

    response.assertHeader('referrer-policy', 'strict-origin-when-cross-origin')
  })
})
