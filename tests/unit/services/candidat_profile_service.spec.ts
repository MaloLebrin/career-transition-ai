import { SkillFactory } from '#database/factories/skill_factory'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import Education from '#models/education'
import Employee from '#models/employee'
import EmployeeSkill from '#models/employee_skill'
import Experience from '#models/experience'
import Skill from '#models/skill'
import User from '#models/user'
import { CandidatProfileService } from '#services/candidat_profile_service'
import type { EmailVerificationService } from '#services/email_verification_service'
import { EmployeesService } from '#services/employees_service'
import type { OnboardingMailService } from '#services/onboarding_mail_service'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createOrganization,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

const sentLinks: number[] = []

function makeService() {
  sentLinks.length = 0
  const employees = new EmployeesService({} as unknown as OnboardingMailService)
  const verification = {
    sendLinkSafely: async (user: User) => {
      sentLinks.push(user.id)
    },
  } as unknown as EmailVerificationService
  return new CandidatProfileService(employees, verification)
}

test.group('CandidatProfileService.updateForUser — profil', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('met à jour User et Employee (sans tableaux, hors transaction)', async ({ assert }) => {
    const { user, employee } = await createCandidate()

    const result = await makeService().updateForUser(user, {
      name: 'Nouveau Nom',
      email: 'nouveau@example.com',
      currentRole: 'Comptable',
      targetRole: 'Contrôleur de gestion',
      summary: 'Reconversion',
    })

    assert.equal(result.employee.id, employee.id)
    const freshUser = await User.findOrFail(user.id)
    assert.equal(freshUser.name, 'Nouveau Nom')
    assert.equal(freshUser.email, 'nouveau@example.com')
    const fresh = await Employee.findOrFail(employee.id)
    assert.equal(fresh.name, 'Nouveau Nom')
    assert.equal(fresh.currentRole, 'Comptable')
    assert.equal(fresh.targetRole, 'Contrôleur de gestion')
    assert.equal(fresh.summary, 'Reconversion')
  })

  test('les champs absents du payload sont conservés', async ({ assert }) => {
    const { user, employee } = await createCandidate()

    await makeService().updateForUser(user, { summary: 'Seul changement' })

    const fresh = await Employee.findOrFail(employee.id)
    assert.equal(fresh.summary, 'Seul changement')
    assert.equal(fresh.name, employee.name)
    assert.equal(fresh.currentRole, employee.currentRole)
    const reloaded = await User.findOrFail(user.id)
    assert.equal(reloaded.email, user.email)
  })

  test('forceOnboarded active le candidat même si le payload dit le contraire', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })
    await employee.merge({ status: EMPLOYEES_STATUS.ONBOARDING }).save()

    await makeService().updateForUser(user, { onboarded: false }, { forceOnboarded: true })

    const fresh = await Employee.findOrFail(employee.id)
    assert.isTrue(fresh.onboarded)
    assert.equal(fresh.status, EMPLOYEES_STATUS.ACTIVE)
  })

  test('onboarded=true passe aussi le statut à actif', async ({ assert }) => {
    const { user, employee } = await createCandidate({ onboarded: false })
    await employee.merge({ status: EMPLOYEES_STATUS.ONBOARDING }).save()

    await makeService().updateForUser(user, { onboarded: true })

    const fresh = await Employee.findOrFail(employee.id)
    assert.isTrue(fresh.onboarded)
    assert.equal(fresh.status, EMPLOYEES_STATUS.ACTIVE)
  })

  test('refuse un e-mail déjà pris (sans tableaux)', async ({ assert }) => {
    const { user } = await createCandidate()
    const other = await createAdvisor()

    const error = await makeService()
      .updateForUser(user, { email: other.email })
      .catch((e) => e)

    assert.instanceOf(error, EmailAlreadyUsedException)
    assert.equal(error.status, 409)
    const reloaded = await User.findOrFail(user.id)
    assert.equal(reloaded.email, user.email)
  })

  test('refuse un e-mail déjà pris (avec tableaux) et annule toute la transaction', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const other = await createAdvisor()
    await Experience.create({
      employeeId: employee.id,
      title: 'Existant',
      company: 'ACME',
      type: EXPERIENCES_TYPES.CDI,
      startDate: DateTime.fromISO('2020-01-01'),
      endDate: null,
      isCurrent: true,
      description: null,
      sortOrder: null,
    })

    const error = await makeService()
      .updateForUser(user, { name: 'Changé', email: other.email, experiences: [] })
      .catch((e) => e)

    assert.instanceOf(error, EmailAlreadyUsedException)
    assert.lengthOf(await Experience.query().where('employeeId', employee.id), 1)
    const freshUser = await User.findOrFail(user.id)
    assert.equal(freshUser.name, user.name)
  })

  test("conserver son propre e-mail n'est pas un conflit", async ({ assert }) => {
    const { user } = await createCandidate()

    await makeService().updateForUser(user, { email: user.email, name: 'Même mail' })

    const reloaded = await User.findOrFail(user.id)
    assert.equal(reloaded.name, 'Même mail')
  })

  test('un utilisateur sans fiche candidat dans son organisation est rejeté', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()

    await assert.rejects(
      () => makeService().updateForUser(advisor, { summary: 'x' }),
      'Profil candidat introuvable.'
    )
  })

  test("la fiche d'une autre organisation n'est jamais modifiée (sans tableaux)", async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const otherOrg = await createOrganization()
    // Utilisateur rattaché à une autre organisation que sa fiche.
    await user.merge({ organizationId: otherOrg.id }).save()

    await assert.rejects(() => makeService().updateForUser(user, { summary: 'intrusion' }))
    const reloaded = await Employee.findOrFail(employee.id)
    assert.notEqual(reloaded.summary, 'intrusion')
  })

  test("la fiche d'une autre organisation n'est jamais modifiée (avec tableaux)", async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const otherOrg = await createOrganization()
    await user.merge({ organizationId: otherOrg.id }).save()

    const error = await makeService()
      .updateForUser(user, { summary: 'intrusion', skills: [] })
      .catch((e) => e)

    assert.equal(error?.code, 'E_ROW_NOT_FOUND')
    const reloaded = await Employee.findOrFail(employee.id)
    assert.notEqual(reloaded.summary, 'intrusion')
  })
})

test.group('CandidatProfileService.updateForUser — expériences et formations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('remplace exactement les expériences, en ignorant les entrées incomplètes', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const service = makeService()
    await service.updateForUser(user, {
      experiences: [{ title: 'Ancienne', company: 'Old', startDate: '2010-01' }],
    })

    await service.updateForUser(user, {
      experiences: [
        {
          title: '  Chef de projet ',
          company: ' ACME ',
          type: 'CDI',
          startDate: '2019-03',
          endDate: '2021-06-15',
          description: '  ',
        },
        {
          title: 'Consultant',
          company: 'Indé',
          type: 'Freelance',
          startDate: '2021-07-01',
          isCurrent: true,
        },
        { title: 'Stagiaire', company: 'Labo', type: 'Stage', startDate: '2018-01' },
        { title: 'Inconnu', company: 'X', type: 'cdd', startDate: '2017-01' },
        { title: 'Sans entreprise', company: '', startDate: '2015-01' },
        { title: 'Date invalide', company: 'Y', startDate: 'pas une date' },
      ],
    })

    const rows = await Experience.query()
      .where('employeeId', employee.id)
      .orderBy('startDate', 'desc')
    assert.deepEqual(
      rows.map((r) => r.title),
      ['Consultant', 'Chef de projet', 'Stagiaire', 'Inconnu']
    )
    const [consultant, chef, stage, cdd] = rows
    assert.equal(chef.company, 'ACME')
    assert.equal(chef.type, EXPERIENCES_TYPES.CDI)
    assert.equal(chef.startDate.toISODate(), '2019-03-01')
    assert.equal(chef.endDate?.toISODate(), '2021-06-15')
    assert.isNull(chef.description)
    assert.isFalse(chef.isCurrent)
    assert.equal(consultant.type, EXPERIENCES_TYPES.FREELANCE)
    assert.isTrue(consultant.isCurrent)
    assert.isNull(consultant.endDate)
    assert.equal(stage.type, EXPERIENCES_TYPES.OTHER)
    assert.equal(cdd.type, EXPERIENCES_TYPES.CDD)
  })

  test('remplace exactement les formations', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const service = makeService()
    await service.updateForUser(user, {
      educations: [{ degree: 'Bac', school: 'Lycée', startDate: '2005-09' }],
    })

    await service.updateForUser(user, {
      educations: [
        {
          degree: ' Master ',
          school: ' Université ',
          startDate: '2012-09',
          endDate: '2014-06',
          description: 'Finance',
        },
        { degree: 'Sans école', school: '', startDate: '2010-09' },
      ],
    })

    const rows = await Education.query().where('employeeId', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].degree, 'Master')
    assert.equal(rows[0].school, 'Université')
    assert.equal(rows[0].startDate.toISODate(), '2012-09-01')
    assert.equal(rows[0].endDate?.toISODate(), '2014-06-01')
    assert.equal(rows[0].description, 'Finance')
  })

  test('un tableau vide efface, un tableau absent conserve', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const service = makeService()
    await service.updateForUser(user, {
      experiences: [{ title: 'Exp', company: 'Co', startDate: '2020-01' }],
      educations: [{ degree: 'Deg', school: 'Sch', startDate: '2015-09' }],
    })

    await service.updateForUser(user, { experiences: [] })

    assert.lengthOf(await Experience.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Education.query().where('employeeId', employee.id), 1)
  })
})

test.group('CandidatProfileService.updateForUser — compétences', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('réutilise une compétence globale ou de l’organisation, crée les autres', async ({
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const global = await SkillFactory.merge({ name: 'Leadership', organizationId: null }).create()
    const orgSkill = await SkillFactory.merge({
      name: 'Négociation',
      organizationId: employee.organizationId,
    }).create()
    // Compétence homonyme d'une autre organisation : ne doit pas être réutilisée.
    const otherOrg = await createOrganization()
    const foreign = await SkillFactory.merge({
      name: 'Python',
      organizationId: otherOrg.id,
    }).create()

    await makeService().updateForUser(user, {
      skills: [
        { name: 'Leadership', level: 4 },
        { name: ' Négociation ', level: 2 },
        { name: 'Python', level: 5 },
        { name: '   ' },
      ],
    })

    const links = await EmployeeSkill.query().where('employeeId', employee.id).orderBy('id')
    assert.lengthOf(links, 3)
    assert.equal(links[0].skillId, global.id)
    assert.equal(links[0].level, 4)
    assert.equal(links[1].skillId, orgSkill.id)
    assert.notEqual(links[2].skillId, foreign.id)

    const created = await Skill.findOrFail(links[2].skillId)
    assert.equal(created.name, 'Python')
    assert.equal(created.organizationId, employee.organizationId)
  })

  test('normalise le niveau entre 1 et 5 (3 par défaut)', async ({ assert }) => {
    const { user, employee } = await createCandidate()

    await makeService().updateForUser(user, {
      skills: [
        { name: 'A', level: 0 },
        { name: 'B', level: 9 },
        { name: 'C', level: 2.6 },
        { name: 'D', level: Number.NaN },
        { name: 'E' },
      ],
    })

    const links = await EmployeeSkill.query().where('employeeId', employee.id).orderBy('id')
    assert.deepEqual(
      links.map((l) => l.level),
      [1, 5, 3, 3, 3]
    )
  })

  test('ignore une compétence supprimée (soft delete) et en recrée une', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const deleted = await SkillFactory.merge({ name: 'Archivée', organizationId: null }).create()
    await deleted.merge({ deletedAt: DateTime.now() }).save()

    await makeService().updateForUser(user, { skills: [{ name: 'Archivée', level: 3 }] })

    const [link] = await EmployeeSkill.query().where('employeeId', employee.id)
    assert.notEqual(link.skillId, deleted.id)
  })

  test('remplace les compétences à chaque appel', async ({ assert }) => {
    const { user, employee } = await createCandidate()
    const service = makeService()
    await service.updateForUser(user, { skills: [{ name: 'X1', level: 2 }] })

    await service.updateForUser(user, { skills: [{ name: 'X2', level: 3 }] })

    const links = await EmployeeSkill.query().where('employeeId', employee.id)
    assert.lengthOf(links, 1)
    const reloaded = await Skill.findOrFail(links[0].skillId)
    assert.equal(reloaded.name, 'X2')
  })
})

test.group('CandidatProfileService.updateForUser — changement d’e-mail (M6)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('B2C : e-mail non vérifié, aligné sur la fiche, lien renvoyé', async ({ assert }) => {
    const { user, employee } = await createB2cCandidate()
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await makeService().updateForUser(user, { email: 'nouvelle@example.com' })

    const freshUser = await User.findOrFail(user.id)
    assert.isNull(freshUser.emailVerifiedAt)
    const freshEmployee = await Employee.findOrFail(employee.id)
    assert.equal(freshEmployee.email, 'nouvelle@example.com')
    assert.deepEqual(sentLinks, [user.id])
  })

  test('avec tableaux (transaction) : même comportement', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await makeService().updateForUser(user, { email: 'autre@example.com', experiences: [] })

    const reloaded = await User.findOrFail(user.id)
    assert.isNull(reloaded.emailVerifiedAt)
    assert.deepEqual(sentLinks, [user.id])
  })

  test('e-mail inchangé : vérification conservée, aucun lien', async ({ assert }) => {
    const { user } = await createB2cCandidate()
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await makeService().updateForUser(user, { email: user.email, name: 'Même mail' })

    const reloaded = await User.findOrFail(user.id)
    assert.isNotNull(reloaded.emailVerifiedAt)
    assert.lengthOf(sentLinks, 0)
  })

  test('B2B : vérification remise à zéro mais aucun lien envoyé', async ({ assert }) => {
    const { user } = await createCandidate()
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await makeService().updateForUser(user, { email: 'b2b-nouveau@example.com' })

    const reloaded = await User.findOrFail(user.id)
    assert.isNull(reloaded.emailVerifiedAt)
    assert.lengthOf(sentLinks, 0)
  })
})
