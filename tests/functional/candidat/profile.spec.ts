import { test } from '@japa/runner'
import { EducationFactory } from '#database/factories/education_factory'
import { ExperienceFactory } from '#database/factories/experience_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import Education from '#models/education'
import Employee from '#models/employee'
import User from '#models/user'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import { createAdvisor, createCandidate, createOrganization } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { DateTime } from 'luxon'

/**
 * Profil candidat :
 * - `GET /dashboard/candidat/profile` (`EmployeesController.showProfileDashboard`),
 *   derrière `checkOnboarding()` ;
 * - `PUT /dashboard/candidat/profile` (`AuthController.updateProfileCandidat`),
 *   hors `checkOnboarding()`.
 */

const URL = '/dashboard/candidat/profile'
const PAGE = 'dashboard/employee/profile/Home'

test.group('Candidat — profil : page (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('rend la page avec la fiche, ses formations et expériences', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()
    const experience = await ExperienceFactory.merge({ employeeId: employee.id }).create()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE, [
      'employeeId',
      'employee',
      'notes',
      'availableSkills',
    ])
    assert.equal(props.employeeId, employee.id)
    const dto = props.employee as {
      id: number
      educations: Array<{ id: number }>
      experiences: Array<{ id: number }>
    }
    assert.equal(dto.id, employee.id)
    assert.deepEqual(
      dto.educations.map((e) => e.id),
      [education.id]
    )
    assert.deepEqual(
      dto.experiences.map((e) => e.id),
      [experience.id]
    )
  })

  test("n'expose que les notes partagées et non supprimées, sans droit d'édition", async ({
    client,
    assert,
  }) => {
    const organization = await createOrganization()
    const advisor = await createAdvisor(organization)
    const { user, employee } = await createCandidate({ organization, advisor })
    const base = { organizationId: employee.organizationId, employeeId: employee.id }
    const shared = await NoteFactory.merge({
      ...base,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.SHARED,
      content: 'Note partagée',
    }).create()
    await NoteFactory.merge({
      ...base,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.PRIVATE,
      content: 'Note privée',
    }).create()
    await NoteFactory.merge({
      ...base,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.SHARED,
      content: 'Note supprimée',
      deletedAt: DateTime.now(),
    }).create()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    const notes = props.notes as Array<{
      id: number
      content: string
      authorName: string
      canEdit: boolean
    }>
    assert.lengthOf(notes, 1)
    assert.equal(notes[0].id, shared.id)
    assert.equal(notes[0].content, 'Note partagée')
    assert.equal(notes[0].authorName, advisor.name ?? 'Unknown')
    assert.isFalse(notes[0].canEdit)
  })

  test("propose les compétences de l'organisation et globales, pas celles d'une autre", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const otherOrg = await createOrganization()
    const own = await SkillFactory.merge({
      organizationId: employee.organizationId,
      name: 'Budget',
    }).create()
    const global = await SkillFactory.merge({ organizationId: null, name: 'Anglais' }).create()
    await SkillFactory.merge({ organizationId: otherOrg.id, name: 'Secret' }).create()
    await SkillFactory.merge({
      organizationId: employee.organizationId,
      name: 'Archivée',
      deletedAt: DateTime.now(),
    }).create()

    const response = await client.get(URL).loginAs(user).withInertia()

    const props = assertPage(assert, response, PAGE)
    const skills = props.availableSkills as Array<{ id: number; name: string }>
    // Triées par nom.
    assert.deepEqual(
      skills.map((s) => s.id),
      [global.id, own.id]
    )
  })

  test("renvoie vers l'onboarding un candidat non onboardé", async ({ client }) => {
    const { user } = await createCandidate({ onboarded: false })

    const response = await client.get(URL).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(URL).loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })
})

test.group('Candidat — profil : mise à jour (PUT)', (group) => {
  group.each.setup(() => truncateDb())

  test("met à jour l'utilisateur et la fiche, puis redirige vers l'accueil", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({
        name: 'Camille Martin',
        email: 'camille.martin@example.com',
        currentRole: 'Comptable',
        targetRole: 'Contrôleuse de gestion',
        summary: 'Reconversion vers le contrôle de gestion',
      })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    response.assertFlashMessage('success', 'Profil mis à jour.')

    await user.refresh()
    assert.equal(user.name, 'Camille Martin')
    assert.equal(user.email, 'camille.martin@example.com')

    await employee.refresh()
    assert.equal(employee.name, 'Camille Martin')
    assert.equal(employee.currentRole, 'Comptable')
    assert.equal(employee.targetRole, 'Contrôleuse de gestion')
    assert.equal(employee.summary, 'Reconversion vers le contrôle de gestion')
  })

  test('un payload partiel ne modifie que les champs fournis', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const before = { name: employee.name, currentRole: employee.currentRole }

    await client.put(URL).loginAs(user).json({ targetRole: 'Data analyst' }).redirects(0)

    await employee.refresh()
    assert.equal(employee.targetRole, 'Data analyst')
    assert.equal(employee.name, before.name)
    assert.equal(employee.currentRole, before.currentRole)
  })

  test('un tableau fourni remplace exactement les formations existantes', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await EducationFactory.merge({ employeeId: employee.id, degree: 'Ancienne' }).create()

    await client
      .put(URL)
      .loginAs(user)
      .json({
        educations: [
          { degree: 'BTS', school: 'Lycée Voltaire', startDate: '2010-09', endDate: '2012-06' },
          // Entrée incomplète : ignorée côté serveur, sans erreur.
          { degree: '', school: 'Sans diplôme', startDate: '2012-09' },
        ],
      })
      .redirects(0)

    const educations = await Education.query().where('employeeId', employee.id)
    assert.lengthOf(educations, 1)
    assert.equal(educations[0].degree, 'BTS')
    assert.equal(educations[0].startDate.toISODate(), '2010-09-01')
    assert.equal(educations[0].endDate?.toISODate(), '2012-06-01')
  })

  test('refuse un email invalide sans rien modifier', async ({ client, assert }) => {
    const { user } = await createCandidate()
    const email = user.email

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ email: 'pas-un-email', name: 'Nouveau nom' })
      .redirects(0)

    assertFieldErrors(assert, response, ['email'])
    await user.refresh()
    assert.equal(user.email, email)
  })

  test('refuse un email déjà utilisé par un autre compte (409)', async ({ client, assert }) => {
    const { user } = await createCandidate()
    const other = await createCandidate()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ email: other.user.email })
      .redirects(0)

    response.assertStatus(409)
    const reloaded = await User.findOrFail(user.id)
    assert.notEqual(reloaded.email, other.user.email)
  })

  test("reste accessible avant la fin de l'onboarding", async ({ client, assert }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ currentRole: 'Vendeur' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    const reloaded = await Employee.findOrFail(employee.id)
    assert.equal(reloaded.currentRole, 'Vendeur')
    assert.isFalse(reloaded.onboarded)
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.put(URL).loginAs(advisor).json({ name: 'Intrus' }).redirects(0)

    response.assertStatus(403)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client }) => {
    const response = await client.put(URL).json({ name: 'Anonyme' }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})
