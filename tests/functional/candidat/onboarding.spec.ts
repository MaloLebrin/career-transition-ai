import { test } from '@japa/runner'
import { SkillFactory } from '#database/factories/skill_factory'
import Education from '#models/education'
import Employee from '#models/employee'
import EmployeeSkill from '#models/employee_skill'
import Experience from '#models/experience'
import Skill from '#models/skill'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Onboarding candidat — `/dashboard/candidat/onboarding` :
 * - `GET` : `DashboardController.candidatOnboarding` ;
 * - `PUT` : `CandidatOnboardingController.complete`, qui persiste le parcours
 *   (expériences, formations, compétences) et force `onboarded = true`.
 *
 * Les deux routes sont hors `checkOnboarding()` : sinon, la page vers laquelle
 * ce middleware redirige serait elle-même inaccessible.
 */

const URL = '/dashboard/candidat/onboarding'
const PAGE = 'dashboard/employee/onboarding/Onboarding'

test.group('Candidat — onboarding : page (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('rend la page pour un candidat non onboardé', async ({ client, assert }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, ['employee'])
    assert.equal((props.employee as { id: number }).id, employee.id)
  })

  test("renvoie vers l'accueil un candidat déjà onboardé", async ({ client }) => {
    const { user } = await createCandidate({ onboarded: true })

    const response = await client.get(URL).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(URL).loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client }) => {
    const response = await client.get(URL).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})

test.group('Candidat — onboarding : finalisation (PUT)', (group) => {
  group.each.setup(() => truncateDb())

  test('persiste le parcours, marque la fiche onboardée et redirige avec un flash', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })
    await employee.merge({ status: EMPLOYEES_STATUS.ON_HOLD }).save()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({
        currentRole: 'Assistante RH',
        targetRole: 'Chargée de recrutement',
        experiences: [
          {
            title: 'Assistante RH',
            company: 'Initech',
            type: 'CDI',
            startDate: '2019-03',
            endDate: null,
            isCurrent: true,
            description: 'Gestion administrative',
          },
          // Incomplète (pas d'entreprise) : ignorée.
          { title: 'Job étudiant', startDate: '2016-06' },
        ],
        educations: [
          { degree: 'Licence RH', school: 'Université Lyon 2', startDate: '2015-09-01' },
        ],
        skills: [
          { name: 'Recrutement', level: 4 },
          // Niveau hors bornes : ramené dans 1..5.
          { name: 'Paie', level: 9 },
          // Sans nom : ignorée.
          { name: '   ', level: 3 },
        ],
      })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    response.assertFlashMessage('success', 'Onboarding terminé. Bienvenue !')

    const reloaded = await Employee.findOrFail(employee.id)
    assert.isTrue(reloaded.onboarded)
    assert.equal(reloaded.status, EMPLOYEES_STATUS.ACTIVE)
    assert.equal(reloaded.currentRole, 'Assistante RH')
    assert.equal(reloaded.targetRole, 'Chargée de recrutement')

    const experiences = await Experience.query().where('employeeId', employee.id)
    assert.lengthOf(experiences, 1)
    assert.equal(experiences[0].company, 'Initech')
    assert.equal(experiences[0].type, EXPERIENCES_TYPES.CDI)
    assert.equal(experiences[0].startDate.toISODate(), '2019-03-01')
    assert.isTrue(experiences[0].isCurrent)

    const educations = await Education.query().where('employeeId', employee.id)
    assert.lengthOf(educations, 1)
    assert.equal(educations[0].school, 'Université Lyon 2')

    const links = await EmployeeSkill.query().where('employeeId', employee.id).orderBy('level')
    assert.lengthOf(links, 2)
    assert.deepEqual(
      links.map((l) => l.level),
      [4, 5]
    )
  })

  test('réutilise une compétence globale existante au lieu de la dupliquer', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })
    const global = await SkillFactory.merge({ organizationId: null, name: 'Excel' }).create()

    await client
      .put(URL)
      .loginAs(user)
      .json({ skills: [{ name: 'Excel', level: 2 }] })
      .redirects(0)

    assert.lengthOf(await Skill.query().where('name', 'Excel'), 1)
    const link = await EmployeeSkill.query().where('employeeId', employee.id).firstOrFail()
    assert.equal(link.skillId, global.id)
  })

  test('un payload vide suffit à terminer l’onboarding', async ({ client, assert }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client.put(URL).loginAs(user).json({}).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    const reloaded = await Employee.findOrFail(employee.id)
    assert.isTrue(reloaded.onboarded)
  })

  test('`onboarded: false` dans le payload ne peut pas empêcher la finalisation', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    await client.put(URL).loginAs(user).json({ onboarded: false }).redirects(0)

    const reloaded = await Employee.findOrFail(employee.id)
    assert.isTrue(reloaded.onboarded)
  })

  test('refuse un payload invalide et laisse la fiche non onboardée', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ email: 'invalide', skills: 'pas-un-tableau' })
      .redirects(0)

    assertFieldErrors(assert, response, ['email', 'skills'])
    const reloaded = await Employee.findOrFail(employee.id)
    assert.isFalse(reloaded.onboarded)
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.put(URL).loginAs(advisor).json({}).redirects(0)

    response.assertStatus(403)
  })
})
