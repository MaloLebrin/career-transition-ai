import { test } from '@japa/runner'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createInHouseExpert,
  createPlatformOrganization,
  createSuperAdmin,
  createUser,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Équipe interne de la plateforme (#105) :
 * - `GET  /dashboard/super-admin/team` → membres (rôles advisor / expert / admin) et candidats suivis ;
 * - `POST /dashboard/super-admin/team` → invitation dans l'organisation plateforme.
 */
const PAGE = 'dashboard/admin/team/Index'

test.group('Super admin — équipe interne', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('liste les membres internes avec leurs candidats suivis, hors super admins et cabinets', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const platform = await createPlatformOrganization()
    const expert = await createInHouseExpert()
    const reader = await createUser(USERS_ROLES.EXPERT, platform)
    await createAdvisor()
    await createB2cCandidate({ paid: true, expert })
    await createB2cCandidate({ paid: true, expert })

    const response = await client.get(EXPERT_REQUEST_PATHS.team).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, PAGE, ['members'])
    const members = props.members as Array<{
      id: number
      role: string
      assignedCandidatesCount: number
      onboardingCompleted: boolean
    }>
    assert.sameMembers(
      members.map((m) => m.id),
      [expert.id, reader.id]
    )
    assert.equal(members.find((m) => m.id === expert.id)!.assignedCandidatesCount, 2)
    assert.equal(members.find((m) => m.id === reader.id)!.assignedCandidatesCount, 0)
    assert.isTrue(members.every((m) => m.onboardingCompleted))
  })

  test('invite un membre dans l’organisation plateforme et envoie le lien d’activation', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .post(EXPERT_REQUEST_PATHS.team)
      .loginAs(superAdmin)
      .form({ name: 'Nadia Experte', email: 'nadia@plateforme.test', role: USERS_ROLES.ADVISOR })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', EXPERT_REQUEST_PATHS.team)
    response.assertFlashMessage(
      'success',
      'Membre invité : un e-mail d’activation lui a été envoyé.'
    )
    const user = await User.findByOrFail('email', 'nadia@plateforme.test')
    assert.equal(user.organizationId, superAdmin.organizationId)
    assert.equal(user.role, USERS_ROLES.ADVISOR)
    assert.isNull(user.onboardingCompletedAt)
    const token = await OnboardingToken.query().where('userId', user.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['nadia@plateforme.test'])
    assert.equal(OnboardingToken.hash(mails.onboardingSecret()), token.token)
  })

  test('refuse les rôles employee et super_admin, et un e-mail déjà pris', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const existing = await createInHouseExpert()

    for (const role of [USERS_ROLES.EMPLOYEE, USERS_ROLES.SUPER_ADMIN]) {
      const response = await client
        .post(EXPERT_REQUEST_PATHS.team)
        .loginAs(superAdmin)
        .withInertia()
        .header('referer', EXPERT_REQUEST_PATHS.team)
        .form({ name: 'X', email: `x-${role}@plateforme.test`, role })
        .redirects(0)
      assertFieldErrors(assert, response, ['role'])
    }

    const duplicate = await client
      .post(EXPERT_REQUEST_PATHS.team)
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .form({ name: 'Doublon', email: existing.email, role: USERS_ROLES.ADVISOR })
      .redirects(0)
    assert.isAtLeast(duplicate.status(), 400)
    assert.deepEqual(mails.sent, [])
  })

  test('réservé aux super admins', async ({ client }) => {
    const admin = await createAdmin()
    const get = await client.get(EXPERT_REQUEST_PATHS.team).loginAs(admin).redirects(0)
    get.assertStatus(403)
    const post = await client
      .post(EXPERT_REQUEST_PATHS.team)
      .loginAs(admin)
      .form({ name: 'X', email: 'x@y.test', role: USERS_ROLES.ADVISOR })
      .redirects(0)
    post.assertStatus(403)
  })
})
