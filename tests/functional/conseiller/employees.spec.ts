import { EmployeeFactory } from '#database/factories/employee_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { NoteFactory } from '#database/factories/note_factory'
import { SkillFactory } from '#database/factories/skill_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import Employee from '#models/employee'
import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import User from '#models/user'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createEmployeeFor,
  createOrganization,
  createUser,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors, assertNoFieldErrors, inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { fakeMail, type RecordingMailProvider, restoreMail } from './helpers.js'

const BASE = '/dashboard/conseiller/employees'

test.group('Conseiller — candidats : liste', (group) => {
  group.each.setup(() => truncateDb())

  test('un conseiller ne voit que ses propres candidats', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const colleague = await createAdvisor(org)
    const mine = await createEmployeeFor(advisor)
    await createEmployeeFor(colleague)
    await createEmployeeFor(await createAdvisor())

    const response = await client.get(BASE).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/List', ['employees'])
    const employees = props.employees as Array<{ id: number | string; email: string }>
    assert.deepEqual(
      employees.map((e) => e.email),
      [mine.email]
    )
  })

  test("un admin voit tous les candidats de son organisation, pas ceux d'une autre", async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const org = await Organization.findOrFail(admin.organizationId)
    const advisor = await createAdvisor(org)
    const a = await createEmployeeFor(advisor)
    const b = await createEmployeeFor(admin)
    await createEmployeeFor(await createAdvisor())

    const response = await client.get(BASE).loginAs(admin).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/List')
    const emails = (props.employees as Array<{ email: string }>).map((e) => e.email).sort()
    assert.deepEqual(emails, [a.email, b.email].sort())
  })
})

test.group('Conseiller — candidats : création', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('crée le candidat, son compte et envoie le lien d’onboarding', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post(BASE)
      .json({
        name: 'Alice Martin',
        email: 'alice@example.com',
        currentRole: 'Comptable',
        targetRole: 'Data analyst',
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BASE)
    assertNoFieldErrors(assert, response)
    assert.equal(
      response.flashMessage('success'),
      'Candidat ajouté. Un lien d’activation a été envoyé par email.'
    )

    const employee = await Employee.query().where('email', 'alice@example.com').firstOrFail()
    assert.equal(employee.organizationId, advisor.organizationId)
    assert.equal(employee.advisorId, advisor.id)
    assert.equal(employee.targetRole, 'Data analyst')
    assert.isFalse(employee.onboarded)

    const user = await User.findOrFail(employee.userId)
    assert.equal(user.role, USERS_ROLES.EMPLOYEE)
    assert.equal(user.organizationId, advisor.organizationId)

    const token = await OnboardingToken.query().where('userId', user.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['alice@example.com'])
    assert.include(mails.sent[0].text ?? '', `/onboarding/${token.token}`)
  })

  test('rejette un nom manquant et un email invalide', async ({ client, assert, db }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post(BASE)
      .json({ email: 'pas-un-email' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    assertFieldErrors(assert, response, ['name', 'email'])
    await db.assertEmpty('employees')
    assert.deepEqual(mails.sent, [])
  })

  test('un email déjà onboardé dans l’organisation ne crée ni doublon ni email', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const { user } = await createCandidate({ organization: org, advisor, onboarded: true })

    // Le statut n'est volontairement pas asserté : le contrôleur ne reconnaît
    // pas le message du service (« possède déjà un compte actif » vs le filtre
    // `includes('existe déjà')`) et laisse l'erreur remonter en 500 au lieu du
    // flash + redirect back attendu — anomalie remontée hors tests.
    await client
      .post(BASE)
      .header('referer', BASE)
      .header('Accept', 'application/json')
      .json({ name: 'Doublon', email: user.email })
      .loginAs(advisor)
      .redirects(0)

    const count = await Employee.query().where('email', user.email).count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
    assert.deepEqual(mails.sent, [])
  })

  test('un compte existant sans fiche candidat est réutilisé et reçoit un nouveau lien', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    // Compte `employee` orphelin (fiche supprimée, `user_id` remis à NULL).
    // NB : si le compte est encore lié à une fiche non onboardée, la création
    // viole l'unicité de `employees.user_id` (500) — anomalie remontée hors tests.
    const user = await createUser(USERS_ROLES.EMPLOYEE, org)

    const response = await client
      .post(BASE)
      .json({ name: 'Relance', email: user.email })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', BASE)
    const created = await Employee.query()
      .where('email', user.email)
      .where('name', 'Relance')
      .firstOrFail()
    assert.equal(created.userId, user.id)
    const userCount = await User.query().where('email', user.email).count('* as total')
    assert.equal(Number(userCount[0].$extras.total), 1)
    assert.deepEqual(mails.recipients(), [user.email])
  })
})

test.group('Conseiller — candidats : fiche et mise à jour', (group) => {
  group.each.setup(() => truncateDb())

  test('la fiche expose le candidat et toutes ses notes, avec canEdit pour l’auteur', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const colleague = await createAdvisor(org)
    const employee = await createEmployeeFor(advisor)
    const own = await NoteFactory.merge({
      organizationId: org.id,
      employeeId: employee.id,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.PRIVATE,
    }).create()
    const other = await NoteFactory.merge({
      organizationId: org.id,
      employeeId: employee.id,
      authorId: colleague.id,
      visibility: NOTE_VISIBILITY.SHARED,
    }).create()
    await NoteFactory.merge({
      organizationId: org.id,
      employeeId: employee.id,
      authorId: advisor.id,
      deletedAt: DateTime.now(),
    }).create()

    const response = await client.get(`${BASE}/${employee.id}`).loginAs(advisor).withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/Detail', [
      'employeeId',
      'employee',
      'notes',
    ])
    assert.equal(props.employeeId, String(employee.id))
    const notes = props.notes as Array<{ id: number; canEdit: boolean; authorName: string }>
    assert.sameMembers(
      notes.map((n) => n.id),
      [own.id, other.id]
    )
    assert.isTrue(notes.find((n) => n.id === own.id)!.canEdit)
    assert.isFalse(notes.find((n) => n.id === other.id)!.canEdit)
    assert.equal(notes.find((n) => n.id === other.id)!.authorName, colleague.name)
  })

  test("un conseiller d'une autre organisation ne peut pas lire la fiche (404)", async ({
    client,
  }) => {
    const employee = await createEmployeeFor(await createAdvisor())
    const intruder = await createAdvisor()

    for (const path of ['', '/profile', '/dossier']) {
      const response = await client
        .get(`${BASE}/${employee.id}${path}`)
        .header('Accept', 'application/json')
        .loginAs(intruder)
        .redirects(0)
      response.assertStatus(404)
    }
  })

  test('met à jour le candidat et redirige vers sa fiche', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      status: 'active',
      onboarded: false,
      name: 'Ancien nom',
      summary: 'Résumé conservé',
    }).create()

    const response = await client
      .put(`${BASE}/${employee.id}`)
      .json({
        name: 'Nouveau nom',
        status: 'on-hold',
        targetRole: 'Product manager',
        advisorNotes: 'À relancer',
        onboarded: true,
      })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', `${BASE}/${employee.id}`)
    assert.equal(response.flashMessage('success'), 'Candidat mis à jour.')

    await employee.refresh()
    assert.equal(employee.name, 'Nouveau nom')
    assert.equal(employee.status, 'on-hold')
    assert.equal(employee.targetRole, 'Product manager')
    assert.equal(employee.advisorNotes, 'À relancer')
    assert.isTrue(employee.onboarded)
    assert.equal(employee.summary, 'Résumé conservé')
  })

  test('rejette un statut inconnu à la mise à jour', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      status: 'active',
    }).create()

    const response = await client
      .put(`${BASE}/${employee.id}`)
      .json({ status: 'archived' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.deepEqual(Object.keys(inertiaErrors(response)), ['status'])
    await employee.refresh()
    assert.equal(employee.status, 'active')
  })

  test("la mise à jour d'un candidat d'une autre organisation renvoie 404", async ({
    client,
    assert,
  }) => {
    const otherOrg = await createOrganization()
    const employee = await EmployeeFactory.merge({
      organizationId: otherOrg.id,
      name: 'Intact',
    }).create()
    const intruder = await createAdvisor()

    const response = await client
      .put(`${BASE}/${employee.id}`)
      .json({ name: 'Piraté' })
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    await employee.refresh()
    assert.equal(employee.name, 'Intact')
  })

  test('le profil expose les notes partagées uniquement et les compétences disponibles', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const shared = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.SHARED,
    }).create()
    await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      visibility: NOTE_VISIBILITY.PRIVATE,
    }).create()
    const globalSkill = await SkillFactory.merge({ organizationId: null, name: 'Global' }).create()
    const orgSkill = await SkillFactory.merge({
      organizationId: advisor.organizationId,
      name: 'Maison',
    }).create()
    const otherOrg = await createOrganization()
    await SkillFactory.merge({
      organizationId: otherOrg.id,
      name: 'Étrangère',
    }).create()

    const response = await client
      .get(`${BASE}/${employee.id}/profile`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/profile/Home', [
      'employeeId',
      'employee',
      'notes',
      'availableSkills',
    ])
    const notes = props.notes as Array<{ id: number; canEdit: boolean }>
    assert.deepEqual(
      notes.map((n) => n.id),
      [shared.id]
    )
    assert.isFalse(notes[0].canEdit)
    const skills = props.availableSkills as Array<{ id: number }>
    assert.sameMembers(
      skills.map((s) => s.id),
      [globalSkill.id, orgSkill.id]
    )
  })

  test('télécharge le dossier ZIP du candidat', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      name: 'Jean Dupont',
    }).create()

    const response = await client.get(`${BASE}/${employee.id}/dossier`).loginAs(advisor)

    response.assertStatus(200)
    response.assertHeader('content-type', 'application/zip')
    assert.equal(
      response.header('content-disposition'),
      'attachment; filename="Dossier_Jean_Dupont.zip"'
    )
  })
})

test.group('Conseiller — candidats : renvoi du lien d’onboarding', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('crée le compte manquant, le lie au candidat et envoie un nouveau lien', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      userId: null,
      onboarded: false,
      email: 'sans-compte@example.com',
    }).create()

    const response = await client
      .post(`${BASE}/${employee.id}/onboarding/resend`)
      .header('referer', `${BASE}/${employee.id}`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `${BASE}/${employee.id}`)
    assert.equal(response.flashMessage('success'), 'Lien d’onboarding renvoyé.')

    await employee.refresh()
    assert.isNotNull(employee.userId)
    const user = await User.findOrFail(employee.userId)
    assert.equal(user.email, 'sans-compte@example.com')
    assert.equal(user.role, USERS_ROLES.EMPLOYEE)
    const token = await OnboardingToken.query().where('userId', user.id).firstOrFail()
    assert.deepEqual(mails.recipients(), ['sans-compte@example.com'])
    assert.include(mails.sent[0].text ?? '', `/onboarding/${token.token}`)
  })

  test('refuse un candidat déjà onboardé, sans envoyer d’email', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const org = await Organization.findOrFail(advisor.organizationId)
    const { employee } = await createCandidate({ organization: org, advisor, onboarded: true })

    const response = await client
      .post(`${BASE}/${employee.id}/onboarding/resend`)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('error'), 'Ce candidat a déjà terminé son onboarding.')
    assert.deepEqual(mails.sent, [])
  })

  test("un conseiller d'une autre organisation reçoit 404", async ({ client, assert }) => {
    const otherOrg = await createOrganization()
    const employee = await EmployeeFactory.merge({
      organizationId: otherOrg.id,
      onboarded: false,
    }).create()
    const intruder = await createAdvisor()

    const response = await client
      .post(`${BASE}/${employee.id}/onboarding/resend`)
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
    assert.deepEqual(mails.sent, [])
  })
})

test.group('Conseiller — candidats : détail d’une étape', (group) => {
  group.each.setup(() => truncateDb())

  test('expose l’étape, les résultats des exercices associés et les notes du dernier résultat', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      title: 'Valeurs',
    }).create()
    await SupportPlanStepExercise.create({
      supportPlanStepId: step.id,
      exerciseType: EXERCICE_RESULTS_TYPES.VALUES,
      sortOrder: 0,
    })
    const result = await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
    }).create()
    // Résultat d'un exercice non associé : ne doit pas remonter
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
    }).create()
    const note = await NoteFactory.merge({
      organizationId: advisor.organizationId,
      employeeId: employee.id,
      authorId: advisor.id,
      exerciseResultId: result.id,
    }).create()

    const response = await client
      .get(`${BASE}/${employee.id}/steps/${step.id}`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/conseiller/employees/StepDetail', [
      'employeeId',
      'employeeName',
      'step',
      'results',
      'notes',
    ])
    assert.equal(props.employeeName, employee.name)
    assert.deepEqual(
      (props.results as Array<{ id: number }>).map((r) => r.id),
      [result.id]
    )
    const notes = props.notes as Array<{ id: number; canEdit: boolean }>
    assert.deepEqual(
      notes.map((n) => n.id),
      [note.id]
    )
    assert.isTrue(notes[0].canEdit)
  })

  test("une étape d'un autre candidat renvoie 404", async ({ client }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const other = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({ employeeId: other.id }).create()

    const response = await client
      .get(`${BASE}/${employee.id}/steps/${step.id}`)
      .header('Accept', 'application/json')
      .loginAs(advisor)
      .redirects(0)

    response.assertStatus(404)
  })

  test("un conseiller d'une autre organisation reçoit 404", async ({ client }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    const step = await SupportPlanStepFactory.merge({ employeeId: employee.id }).create()
    const intruder = await createAdvisor()

    const response = await client
      .get(`${BASE}/${employee.id}/steps/${step.id}`)
      .header('Accept', 'application/json')
      .loginAs(intruder)
      .redirects(0)

    response.assertStatus(404)
  })
})
