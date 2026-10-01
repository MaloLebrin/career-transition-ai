import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
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
  createOrganization,
  createSuperAdmin,
  createUser,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Utilisateurs de la plateforme, côté super admin :
 * GET/POST /dashboard/super-admin/users, POST /users/:id/role, POST /users/:id/resend-onboarding
 */
const USERS = '/dashboard/super-admin/users'

test.group('Super admin — utilisateurs : liste', (group) => {
  group.each.setup(() => truncateDb())

  test('liste les utilisateurs et organisations clientes, hors organisation plateforme', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const platform = await Organization.findOrFail(superAdmin.organizationId)
    await createAdvisor(platform)
    const advisor = await createAdvisor()
    const pending = await createAdmin()
    pending.onboardingCompletedAt = null
    await pending.save()

    const response = await client.get(USERS).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/users/Index', [
      'users',
      'organizations',
    ])
    const users = props.users as Array<{
      id: number
      onboardingCompleted: boolean
      organization: { id: number } | null
    }>
    assert.sameMembers(
      users.map((u) => u.id),
      [advisor.id, pending.id]
    )
    assert.isTrue(users.find((u) => u.id === advisor.id)!.onboardingCompleted)
    assert.isFalse(users.find((u) => u.id === pending.id)!.onboardingCompleted)
    assert.equal(users.find((u) => u.id === advisor.id)!.organization?.id, advisor.organizationId)
    assert.sameMembers(
      (props.organizations as Array<{ id: number }>).map((o) => o.id),
      [advisor.organizationId, pending.organizationId]
    )
  })
})

test.group('Super admin — utilisateurs : création et relance', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('crée un utilisateur dans une organisation cliente et envoie l’invitation', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()

    const response = await client
      .post(USERS)
      .json({
        organizationId: org.id,
        name: 'Eva Expert',
        email: 'eva@example.com',
        role: 'expert',
      })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', USERS)
    assert.equal(
      response.flashMessage('success'),
      'Utilisateur créé. Un email d’invitation a été envoyé.'
    )
    const user = await User.findByOrFail('email', 'eva@example.com')
    assert.equal(user.organizationId, org.id)
    assert.equal(user.role, USERS_ROLES.EXPERT)
    const token = await OnboardingToken.query().where('userId', user.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['eva@example.com'])
    assert.equal(OnboardingToken.hash(mails.onboardingSecret()), token.token)
  })

  test('refuse la création dans l’organisation plateforme (flash error)', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(USERS)
      .header('referer', USERS)
      .json({
        organizationId: superAdmin.organizationId,
        name: 'Interne',
        email: 'interne@example.com',
        role: 'admin',
      })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(
      response.flashMessage('error'),
      'Vous ne pouvez pas créer d’utilisateur dans cette organisation.'
    )
    assert.isNull(await User.findBy('email', 'interne@example.com'))
    assert.deepEqual(mails.sent, [])
  })

  test('refuse un email déjà présent dans l’organisation cible', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    await createUser(USERS_ROLES.ADVISOR, org, { email: 'deja@example.com' })

    const response = await client
      .post(USERS)
      .json({ organizationId: org.id, name: 'X', email: 'Deja@Example.com', role: 'advisor' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('error'), 'Cet email est déjà utilisé.')
    assert.deepEqual(mails.sent, [])
  })

  test('rejette le rôle super_admin et un email invalide', async ({ client, assert, db }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()

    const response = await client
      .post(USERS)
      .json({ organizationId: org.id, name: 'X', email: 'nope', role: 'super_admin' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'role'])
    await db.assertCount('users', 1)
  })

  /** Régression #96 : un `User` de rôle `employee` sans fiche candidat ne peut pas se connecter (401). */
  test('rejette le rôle employee : un candidat se crée par un conseiller ou par inscription', async ({
    client,
    assert,
    db,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()

    const response = await client
      .post(USERS)
      .json({
        organizationId: org.id,
        name: 'Candidat',
        email: 'candidat@example.com',
        role: 'employee',
      })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['role'])
    await db.assertCount('users', 1)
    assert.deepEqual(mails.sent, [])
  })

  test('rejette une organisation inexistante (erreur de validation, pas de 500)', async ({
    client,
    assert,
    db,
  }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(USERS)
      .json({
        organizationId: 999999,
        name: 'Fantôme',
        email: 'fantome@example.com',
        role: 'advisor',
      })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['organizationId'])
    await db.assertCount('users', 1)
    assert.deepEqual(mails.sent, [])
  })

  test('renvoie l’invitation d’un utilisateur non activé en révoquant les anciens liens', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()
    user.onboardingCompletedAt = null
    await user.save()
    const old = await OnboardingToken.createForUser(user.id)

    const response = await client
      .post(`${USERS}/${user.id}/resend-onboarding`)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', USERS)
    assert.equal(response.flashMessage('success'), `Lien d’invitation renvoyé à ${user.email}.`)

    const tokens = await OnboardingToken.query().where('userId', user.id)
    assert.lengthOf(tokens, 1)
    assert.notEqual(tokens[0].token, old.token)
    assert.deepEqual(mails.recipients(), [user.email])
    assert.equal(OnboardingToken.hash(mails.onboardingSecret()), tokens[0].token)
  })

  test('refuse de relancer un compte déjà activé', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()

    const response = await client
      .post(`${USERS}/${user.id}/resend-onboarding`)
      .header('referer', USERS)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('error'), 'Cet utilisateur a déjà activé son compte.')
    assert.deepEqual(mails.sent, [])
  })

  test('refuse de relancer un utilisateur de la plateforme ou inconnu', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const colleague = await createSuperAdmin(
      await Organization.findOrFail(superAdmin.organizationId)
    )

    for (const id of [colleague.id, 999999]) {
      const response = await client
        .post(`${USERS}/${id}/resend-onboarding`)
        .loginAs(superAdmin)
        .withInertia()
        .redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', USERS)
      assert.equal(response.flashMessage('error'), 'Utilisateur introuvable.')
    }
    assert.deepEqual(mails.sent, [])
  })
})

test.group('Super admin — utilisateurs : changement de rôle', (group) => {
  group.each.setup(() => truncateDb())

  test('met à jour le rôle d’un utilisateur', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()

    const response = await client
      .post(`${USERS}/${user.id}/role`)
      .json({ role: USERS_ROLES.ADMIN })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', USERS)
    assert.equal(response.flashMessage('success'), `Rôle mis à jour pour ${user.name}.`)
    await user.refresh()
    assert.equal(user.role, USERS_ROLES.ADMIN)
  })

  test('rejette un rôle inconnu', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()

    const response = await client
      .post(`${USERS}/${user.id}/role`)
      .json({ role: 'god' })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['role'])
    await user.refresh()
    assert.equal(user.role, USERS_ROLES.ADVISOR)
  })

  /** Régression #96 : rétrograder un compte en `employee` le laisserait sans fiche candidat. */
  test('rejette le rôle employee', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()

    const response = await client
      .post(`${USERS}/${user.id}/role`)
      .json({ role: USERS_ROLES.EMPLOYEE })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['role'])
    await user.refresh()
    assert.equal(user.role, USERS_ROLES.ADVISOR)
  })

  test('un utilisateur inconnu renvoie un flash d’erreur', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(`${USERS}/999999/role`)
      .json({ role: USERS_ROLES.ADMIN })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('error'), 'Utilisateur introuvable.')
  })

  /** Régression #66 : l’ancien validator acceptait `super_admin` (escalade de privilège). */
  test('refuse de promouvoir un utilisateur super admin', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const user = await createAdvisor()

    const response = await client
      .post(`${USERS}/${user.id}/role`)
      .json({ role: USERS_ROLES.SUPER_ADMIN })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['role'])
    await user.refresh()
    assert.equal(user.role, USERS_ROLES.ADVISOR)
  })

  /** Régression #66 : le super admin pouvait se rétrograder lui-même. */
  test('refuse de modifier son propre rôle ou celui d’un compte de la plateforme', async ({
    client,
    assert,
  }) => {
    const platform = await createOrganization()
    const superAdmin = await createSuperAdmin(platform)
    const colleague = await createAdvisor(platform)

    for (const target of [superAdmin, colleague]) {
      const response = await client
        .post(`${USERS}/${target.id}/role`)
        .json({ role: USERS_ROLES.ADMIN })
        .header('referer', USERS)
        .loginAs(superAdmin)
        .withInertia()
        .redirects(0)

      response.assertStatus(302)
      assert.equal(response.flashMessage('error'), 'Utilisateur introuvable.')
    }
    await superAdmin.refresh()
    await colleague.refresh()
    assert.equal(superAdmin.role, USERS_ROLES.SUPER_ADMIN)
    assert.equal(colleague.role, USERS_ROLES.ADVISOR)
  })

  test('refuse de modifier le rôle d’un autre super admin', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const other = await createSuperAdmin(await createOrganization())

    const response = await client
      .post(`${USERS}/${other.id}/role`)
      .json({ role: USERS_ROLES.ADMIN })
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(
      response.flashMessage('error'),
      'Le rôle d’un super administrateur ne peut pas être modifié ici.'
    )
    await other.refresh()
    assert.equal(other.role, USERS_ROLES.SUPER_ADMIN)
  })

  test('un admin ne peut pas changer de rôle (403)', async ({ client, assert }) => {
    const admin = await createAdmin()
    const target = await createAdvisor()

    const response = await client
      .post(`${USERS}/${target.id}/role`)
      .json({ role: USERS_ROLES.SUPER_ADMIN })
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(403)
    await target.refresh()
    assert.equal(target.role, USERS_ROLES.ADVISOR)
  })
})
