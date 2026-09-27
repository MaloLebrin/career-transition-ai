import { test } from '@japa/runner'
import { EducationFactory } from '#database/factories/education_factory'
import Education from '#models/education'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertFieldErrors, assertNoFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Formations du candidat — `/dashboard/candidat/educations`
 * (`EducationsController`, `start/routes/dashboard/candidat/education.ts`).
 *
 * Un seul endpoint par verbe : l'identifiant de la formation voyage dans le
 * corps (`id`), pas dans l'URL. Toutes les actions redirigent vers la page
 * profil du candidat.
 */

const URL = '/dashboard/candidat/educations'
const PROFILE = '/dashboard/candidat/profile'

/** Payload de référence : il franchit le validateur (cf. premier test). */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    degree: 'Master Management',
    school: 'IAE Paris',
    startDate: '2015-09-01',
    endDate: '2017-06-30',
    isCurrent: false,
    description: 'Spécialité RH',
    ...overrides,
  }
}

test.group('Candidat — formations : création (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('crée la formation sur la fiche du candidat connecté et redirige vers le profil', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    const response = await client.post(URL).loginAs(user).json(validPayload()).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assertNoFieldErrors(assert, response)

    const educations = await Education.query().where('employeeId', employee.id)
    assert.lengthOf(educations, 1)
    assert.equal(educations[0].degree, 'Master Management')
    assert.equal(educations[0].school, 'IAE Paris')
    assert.equal(educations[0].startDate.toISODate(), '2015-09-01')
    assert.equal(educations[0].endDate?.toISODate(), '2017-06-30')
    assert.isFalse(educations[0].isCurrent)
    assert.equal(educations[0].description, 'Spécialité RH')
  })

  test('formation en cours : sans date de fin ni description', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()

    await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ endDate: null, isCurrent: true, description: undefined }))
      .redirects(0)

    const education = await Education.query().where('employeeId', employee.id).firstOrFail()
    assert.isNull(education.endDate)
    assert.isTrue(education.isCurrent)
    // `description || null` : une description absente est stockée à NULL.
    assert.isNull(education.description)
  })

  test('refuse un payload vide sur chaque champ requis', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client.post(URL).loginAs(user).json({}).redirects(0)

    assertFieldErrors(assert, response, ['degree', 'school', 'startDate', 'endDate'])
    assert.lengthOf(await Education.all(), 0)
  })

  test('refuse une date de début dans le futur', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ startDate: '2999-01-01', endDate: null }))
      .redirects(0)

    assertFieldErrors(assert, response, ['startDate'])
    assert.lengthOf(await Education.all(), 0)
  })

  test('refuse une date de fin antérieure à la date de début', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ startDate: '2017-09-01', endDate: '2016-06-30' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['endDate'])
  })

  test('refuse un diplôme ou une école vides après trim', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ degree: '   ', school: '' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['degree', 'school'])
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client, assert }) => {
    const response = await client.post(URL).json(validPayload()).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.lengthOf(await Education.all(), 0)
  })
})

test.group('Candidat — formations : modification (PUT)', (group) => {
  group.each.setup(() => truncateDb())

  test('met à jour la formation et redirige vers le profil', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(
        validPayload({
          id: education.id,
          degree: 'Doctorat',
          school: 'Sorbonne',
          endDate: null,
          isCurrent: true,
          description: '',
        })
      )
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)

    await education.refresh()
    assert.equal(education.degree, 'Doctorat')
    assert.equal(education.school, 'Sorbonne')
    assert.isNull(education.endDate)
    assert.isTrue(education.isCurrent)
    assert.isNull(education.description)
    assert.equal(education.employeeId, employee.id)
  })

  test('refuse un payload sans id et ne touche à aucune formation', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const education = await EducationFactory.merge({
      employeeId: employee.id,
      degree: 'Licence',
    }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(validPayload({ degree: 'Modifié' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['id'])
    await education.refresh()
    assert.equal(education.degree, 'Licence')
  })

  test('refuse des champs invalides', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json({ id: education.id, degree: '', school: 'X', startDate: 'pas-une-date', endDate: null })
      .redirects(0)

    assertFieldErrors(assert, response, ['degree', 'startDate'])
  })

  test('une formation inexistante répond 404', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(validPayload({ id: 999_999 }))
      .redirects(0)

    response.assertStatus(404)
  })
})

test.group('Candidat — formations : suppression (DELETE)', (group) => {
  group.each.setup(() => truncateDb())

  test('supprime la formation et redirige vers le profil', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()
    const kept = await EducationFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).loginAs(user).json({ id: education.id }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.isNull(await Education.find(education.id))
    assert.isNotNull(await Education.find(kept.id))
  })

  test('refuse une suppression sans id', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await EducationFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).loginAs(user).json({}).redirects(0)

    assertFieldErrors(assert, response, ['id'])
    assert.lengthOf(await Education.all(), 1)
  })

  test('une formation inexistante répond 404', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.delete(URL).loginAs(user).json({ id: 999_999 }).redirects(0)

    response.assertStatus(404)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client, assert }) => {
    const { employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).json({ id: education.id }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.isNotNull(await Education.find(education.id))
  })
})

test.group('Candidat — formations : rôle', (group) => {
  group.each.setup(() => truncateDb())

  test('un conseiller est refusé (403) par le middleware candidate()', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()

    const response = await client.post(URL).loginAs(advisor).json(validPayload()).redirects(0)

    // Non-régression : la route n'avait que `auth()`, le conseiller tombait sur
    // un 500 (« Profil candidat introuvable. ») au lieu d'un refus.
    response.assertStatus(403)
    assert.lengthOf(await Education.all(), 0)
  })

  test("un conseiller d'une autre organisation ne peut pas supprimer une formation", async ({
    client,
    assert,
  }) => {
    const { employee } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: employee.id }).create()
    const advisor = await createAdvisor()

    const response = await client
      .delete(URL)
      .loginAs(advisor)
      .json({ id: education.id })
      .redirects(0)

    response.assertStatus(403)
    assert.isNotNull(await Education.find(education.id))
  })

  test("un candidat pas encore onboardé est renvoyé vers l'onboarding", async ({
    client,
    assert,
  }) => {
    const { user } = await createCandidate({ onboarded: false })

    const response = await client.post(URL).loginAs(user).json(validPayload()).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
    assert.lengthOf(await Education.all(), 0)
  })
})

/**
 * Non-régression IDOR : l'`id` voyage dans le corps de la requête. Avant le
 * correctif, `EducationService.update/delete` faisaient un `findOrFail(id)`
 * sans filtre — n'importe quel candidat modifiait ou supprimait la formation
 * d'un autre. Une formation étrangère doit être introuvable (404), et intacte.
 */
test.group('Candidat — formations : isolation entre candidats', (group) => {
  group.each.setup(() => truncateDb())

  test("ne modifie pas la formation d'un autre candidat (404)", async ({ client, assert }) => {
    const { user: attacker } = await createCandidate()
    const { employee: victim } = await createCandidate()
    const education = await EducationFactory.merge({
      employeeId: victim.id,
      degree: 'Licence',
    }).create()

    const response = await client
      .put(URL)
      .loginAs(attacker)
      .json(validPayload({ id: education.id, degree: 'HACK' }))
      .redirects(0)

    response.assertStatus(404)
    await education.refresh()
    assert.equal(education.degree, 'Licence')
    assert.equal(education.employeeId, victim.id)
  })

  test("ne supprime pas la formation d'un autre candidat (404)", async ({ client, assert }) => {
    const { user: attacker } = await createCandidate()
    const { employee: victim } = await createCandidate()
    const education = await EducationFactory.merge({ employeeId: victim.id }).create()

    const response = await client
      .delete(URL)
      .loginAs(attacker)
      .json({ id: education.id })
      .redirects(0)

    response.assertStatus(404)
    assert.isNotNull(await Education.find(education.id))
  })
})
