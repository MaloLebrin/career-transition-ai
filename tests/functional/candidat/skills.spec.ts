import { test } from '@japa/runner'
import { SkillFactory } from '#database/factories/skill_factory'
import EmployeeSkill from '#models/employee_skill'
import Skill from '#models/skill'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertFieldErrors, assertNoFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Compétences du candidat — `/dashboard/candidat/skills`
 * (`EmployeeSkillsController`, groupe `auth()` + `candidate()` de
 * `start/routes/dashboard/candidat.ts`, hors `checkOnboarding()`).
 *
 * `POST` ajoute une compétence par son **nom** : la `Skill` est retrouvée ou
 * créée dans l'organisation du candidat, puis le niveau est posé sur le pivot
 * `employee_skills` (upsert sur `employeeId` + `skillId`).
 */

const URL = '/dashboard/candidat/skills'
const PROFILE = '/dashboard/candidat/profile'

test.group('Candidat — compétences : ajout (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test("crée la compétence dans l'organisation du candidat et la lie avec son niveau", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json({ name: '  Négociation  ', category: ' Commercial ', level: 4 })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assertNoFieldErrors(assert, response)

    const skill = await Skill.query().where('name', 'Négociation').firstOrFail()
    assert.equal(skill.organizationId, employee.organizationId)
    assert.equal(skill.category, 'Commercial')

    const links = await EmployeeSkill.query().where('employeeId', employee.id)
    assert.lengthOf(links, 1)
    assert.equal(links[0].skillId, skill.id)
    assert.equal(links[0].level, 4)
  })

  test("réutilise la compétence existante de l'organisation au lieu d'en créer une", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const existing = await SkillFactory.merge({
      organizationId: employee.organizationId,
      name: 'Leadership',
      category: 'Management',
    }).create()

    await client.post(URL).loginAs(user).json({ name: 'Leadership', level: 3 }).redirects(0)

    assert.lengthOf(await Skill.query().where('name', 'Leadership'), 1)
    const link = await EmployeeSkill.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(link.skillId, existing.id)
    assert.equal(link.level, 3)
  })

  test('ne réutilise pas la compétence homonyme d’une autre organisation', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const other = await createCandidate()
    const foreign = await SkillFactory.merge({
      organizationId: other.employee.organizationId,
      name: 'Leadership',
    }).create()

    await client.post(URL).loginAs(user).json({ name: 'Leadership', level: 2 }).redirects(0)

    const link = await EmployeeSkill.query().where('employeeId', employee.id).firstOrFail()
    assert.notEqual(link.skillId, foreign.id)
    const skill = await Skill.findOrFail(link.skillId)
    assert.equal(skill.organizationId, employee.organizationId)
  })

  test('ré-ajouter une compétence déjà liée met à jour son niveau sans doublon', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    await client.post(URL).loginAs(user).json({ name: 'TypeScript', level: 2 }).redirects(0)
    await client.post(URL).loginAs(user).json({ name: 'TypeScript', level: 5 }).redirects(0)

    const links = await EmployeeSkill.query().where('employeeId', employee.id)
    assert.lengthOf(links, 1)
    assert.equal(links[0].level, 5)
  })

  test('refuse un nom vide et un niveau hors de 1..5', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json({ name: '   ', level: 6 })
      .redirects(0)

    assertFieldErrors(assert, response, ['name', 'level'])
    assert.lengthOf(await Skill.all(), 0)
    assert.lengthOf(await EmployeeSkill.all(), 0)
  })

  test('refuse un payload sans niveau', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client.post(URL).loginAs(user).json({ name: 'React' }).redirects(0)

    assertFieldErrors(assert, response, ['level'])
  })

  test("reste accessible avant la fin de l'onboarding (hors checkOnboarding)", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client
      .post(URL)
      .loginAs(user)
      .json({ name: 'Communication', level: 3 })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.lengthOf(await EmployeeSkill.query().where('employeeId', employee.id), 1)
  })

  test('un conseiller est refusé (403) par le middleware candidat', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post(URL)
      .loginAs(advisor)
      .json({ name: 'Communication', level: 3 })
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await Skill.all(), 0)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client, assert }) => {
    const response = await client.post(URL).json({ name: 'React', level: 3 }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.lengthOf(await Skill.all(), 0)
  })
})

test.group('Candidat — compétences : modification (PUT)', (group) => {
  group.each.setup(() => truncateDb())

  test('refuse un payload vide', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client.put(URL).loginAs(user).json({}).redirects(0)

    assertFieldErrors(assert, response, ['id', 'level', 'employeeSkillId'])
  })

  test('refuse des identifiants de pivot inexistants', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ id: 999_999, level: 3, employeeSkillId: 999_999 })
      .redirects(0)

    assertFieldErrors(assert, response, ['id', 'employeeSkillId'])
    assert.lengthOf(await EmployeeSkill.all(), 0)
  })

  test('refuse un niveau hors de 1..5', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const skill = await SkillFactory.merge({ organizationId: employee.organizationId }).create()
    const link = await EmployeeSkill.create({
      employeeId: employee.id,
      skillId: skill.id,
      level: 2,
    })

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ id: link.id, level: 0, employeeSkillId: link.id })
      .redirects(0)

    assertFieldErrors(assert, response, ['level'])
    await link.refresh()
    assert.equal(link.level, 2)
  })

  test('un conseiller est refusé (403) par le middleware candidat', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .put(URL)
      .loginAs(advisor)
      .json({ id: 1, level: 3, employeeSkillId: 1 })
      .redirects(0)

    response.assertStatus(403)
  })
})
