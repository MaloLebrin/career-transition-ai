import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import { EmployeeSkillFactory } from '#database/factories/employee_skill_factory'
import { OnboardingTokenFactory } from '#database/factories/onboarding_token_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import ContactRequest, {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
} from '#models/contact_request'
import EmployeeSkill from '#models/employee_skill'
import OnboardingToken from '#models/onboarding_token'
import { createAdvisor, createCandidate, createEmployeeFor } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/**
 * Chaque factory produit une ligne valide en base (contraintes NOT NULL, FK,
 * CHECK, unicité) : une factory cassée ne se découvrirait sinon qu'au premier
 * test qui l'utilise.
 */
test.group('Factories — ContactRequest', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée une demande de contact valide', async ({ assert }) => {
    const created = await ContactRequestFactory.create()

    const row = await ContactRequest.findOrFail(created.id)
    assert.equal(row.status, CONTACT_REQUEST_STATUSES.PENDING)
    assert.include(Object.values(CONTACT_REQUEST_TYPES), row.type)
    assert.isNotEmpty(row.email)
    assert.isNotEmpty(row.message)
  })
})

test.group('Factories — EmployeeSkill', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée une compétence de candidat valide', async ({ assert }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const skill = await SkillFactory.create()

    const created = await EmployeeSkillFactory.merge({
      employeeId: employee.id,
      skillId: skill.id,
    }).create()

    const row = await EmployeeSkill.findOrFail(created.id)
    assert.equal(row.employeeId, employee.id)
    assert.equal(row.skillId, skill.id)
    assert.isAtLeast(row.level, 1)
    assert.isAtMost(row.level, 5)
  })
})

test.group('Factories — OnboardingToken', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un jeton valide au format de createForUser', async ({ assert }) => {
    const { user } = await createCandidate()

    const created = await OnboardingTokenFactory.merge({ userId: user.id }).create()

    const row = await OnboardingToken.findOrFail(created.id)
    assert.equal(row.userId, user.id)
    assert.match(row.token, /^[0-9a-f]{64}$/)
    assert.equal(row.token, OnboardingToken.hash(created.plainToken!))
    assert.isNull(row.usedAt)
    assert.isTrue(row.isValid())
  })

  test('crée son utilisateur via la relation user', async ({ assert }) => {
    const advisor = await createAdvisor()

    const created = await OnboardingTokenFactory.with('user', 1, (user) =>
      user.merge({ organizationId: advisor.organizationId })
    ).create()

    await created.load('user')
    assert.equal(created.user.organizationId, advisor.organizationId)
  })

  test('les états expired et used rendent le jeton invalide', async ({ assert }) => {
    const { user } = await createCandidate()

    const expired = await OnboardingTokenFactory.merge({ userId: user.id })
      .apply('expired')
      .create()
    const used = await OnboardingTokenFactory.merge({ userId: user.id }).apply('used').create()

    assert.isFalse(expired.isValid())
    assert.isNotNull(used.usedAt)
    assert.isFalse(used.isValid())
  })
})
