import { EmployeeFactory } from '#database/factories/employee_factory'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import {
  MAX_LICENSES_CANDIDATES,
  ORGANIZATION_MEMBER_PATHS as PATHS,
} from '#shared/constants/organisation'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createAdmin, createAdvisor, createCandidate } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Gestion de l'équipe du cabinet par son administrateur (#71) :
 * rôle, retrait / rétablissement d'accès, réassignation, licences candidat.
 */
const SETTINGS = '/dashboard/conseiller/settings'

async function adminWithAdvisor() {
  const admin = await createAdmin()
  const org = await Organization.findOrFail(admin.organizationId)
  const advisor = await createAdvisor(org)
  return { admin, org, advisor }
}

test.group('Conseiller — équipe : rôle et accès', (group) => {
  group.each.setup(() => truncateDb())

  test('l’admin change le rôle d’un membre', async ({ client, assert }) => {
    const { admin, advisor } = await adminWithAdvisor()

    const response = await client
      .put(PATHS.role(advisor.id))
      .json({ role: 'admin' })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', SETTINGS)
    assert.equal(response.flashMessage('success'), 'Rôle mis à jour.')
    await advisor.refresh()
    assert.equal(advisor.role, USERS_ROLES.ADMIN)
  })

  test('un rôle hors du cabinet est rejeté (422)', async ({ client, assert }) => {
    const { admin, advisor } = await adminWithAdvisor()

    const response = await client
      .put(PATHS.role(advisor.id))
      .header('Accept', 'application/json')
      .json({ role: 'super_admin' })
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(422)
    await advisor.refresh()
    assert.equal(advisor.role, USERS_ROLES.ADVISOR)
  })

  test('retirer l’accès désactive le compte, le rétablir le réactive', async ({
    client,
    assert,
  }) => {
    const { admin, advisor } = await adminWithAdvisor()

    const off = await client
      .post(PATHS.disable(advisor.id))
      .loginAs(admin)
      .withInertia()
      .redirects(0)
    assert.equal(off.flashMessage('success'), 'Accès retiré.')
    await advisor.refresh()
    assert.isNotNull(advisor.disabledAt)

    const on = await client.post(PATHS.enable(advisor.id)).loginAs(admin).withInertia().redirects(0)
    assert.equal(on.flashMessage('success'), 'Accès rétabli.')
    await advisor.refresh()
    assert.isNull(advisor.disabledAt)
  })

  test('on ne peut pas se retirer son propre accès (422)', async ({ client, assert }) => {
    const { admin } = await adminWithAdvisor()

    const response = await client
      .post(PATHS.disable(admin.id))
      .header('Accept', 'application/json')
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(422)
    await admin.refresh()
    assert.isNull(admin.disabledAt)
  })

  test('membre d’un autre cabinet → 404, inchangé', async ({ client, assert }) => {
    const { admin } = await adminWithAdvisor()
    const foreign = await createAdvisor()

    const response = await client
      .post(PATHS.disable(foreign.id))
      .header('Accept', 'application/json')
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(404)
    await foreign.refresh()
    assert.isNull(foreign.disabledAt)
  })

  test('un conseiller (non admin) est refusé (403)', async ({ client, assert }) => {
    const { advisor, org } = await adminWithAdvisor()
    const peer = await createAdvisor(org)

    const response = await client
      .post(PATHS.disable(peer.id))
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(403)
    await peer.refresh()
    assert.isNull(peer.disabledAt)
  })
})

test.group('Conseiller — équipe : réassignation', (group) => {
  group.each.setup(() => truncateDb())

  test('confie les candidats d’un membre à un autre membre actif', async ({ client, assert }) => {
    const { admin, org, advisor } = await adminWithAdvisor()
    const candidates = await EmployeeFactory.merge({
      organizationId: org.id,
      advisorId: advisor.id,
    }).createMany(2)

    const response = await client
      .post(PATHS.reassign(advisor.id))
      .json({ toUserId: admin.id })
      .loginAs(admin)
      .withInertia()
      .redirects(0)

    assert.equal(response.flashMessage('success'), '2 candidat(s) réassigné(s).')
    for (const c of candidates) {
      const reloaded = await Employee.findOrFail(c.id)
      assert.equal(reloaded.advisorId, admin.id)
    }
  })

  test('destinataire d’un autre cabinet → 422, candidats conservés', async ({ client, assert }) => {
    const { admin, org, advisor } = await adminWithAdvisor()
    const foreign = await createAdvisor()
    const candidate = await EmployeeFactory.merge({
      organizationId: org.id,
      advisorId: advisor.id,
    }).create()

    const response = await client
      .post(PATHS.reassign(advisor.id))
      .header('Accept', 'application/json')
      .json({ toUserId: foreign.id })
      .loginAs(admin)
      .redirects(0)

    response.assertStatus(422)
    const kept = await Employee.findOrFail(candidate.id)
    assert.equal(kept.advisorId, advisor.id)
  })
})

test.group('Conseiller — licences candidat', (group) => {
  group.each.setup(() => truncateDb())

  test('POST employees : 409 une fois MAX_LICENSES_CANDIDATES atteint', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    await EmployeeFactory.merge({ organizationId: advisor.organizationId }).createMany(
      MAX_LICENSES_CANDIDATES
    )

    const response = await client
      .post('/dashboard/conseiller/employees')
      .header('Accept', 'application/json')
      .json({
        name: 'Trop',
        email: 'trop@example.com',
        currentRole: 'Dev',
      })
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(409)
    assert.isNull(await User.findBy('email', 'trop@example.com'))
    assert.isNull(await Employee.findBy('email', 'trop@example.com'))
  })

  test('un candidat connecté ne gère pas l’équipe (403)', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(PATHS.disable(user.id))
      .header('Accept', 'application/json')
      .loginAs(user)
      .redirects(0)

    response.assertStatus(403)
  })
})
