import { test } from '@japa/runner'
import { ExperienceFactory } from '#database/factories/experience_factory'
import Experience from '#models/experience'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertFieldErrors, assertNoFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'

/**
 * Expériences du candidat — `/dashboard/candidat/experiences`
 * (`ExperiencesController`, `start/routes/dashboard/candidat/experience.ts`).
 *
 * Comme les formations : l'`id` voyage dans le corps, et toutes les actions
 * redirigent vers la page profil.
 */

const URL = '/dashboard/candidat/experiences'
const PROFILE = '/dashboard/candidat/profile'

/** Payload de référence : `isCurrent` et `description` sont `nullable()` mais requis. */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Chef de projet',
    company: 'ACME',
    type: EXPERIENCES_TYPES.CDI,
    startDate: '2018-01-15',
    endDate: '2021-12-31',
    isCurrent: false,
    description: 'Pilotage de projets SI',
    ...overrides,
  }
}

test.group('Candidat — expériences : création (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test("crée l'expérience sur la fiche du candidat connecté et redirige vers le profil", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()

    const response = await client.post(URL).loginAs(user).json(validPayload()).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assertNoFieldErrors(assert, response)

    const experiences = await Experience.query().where('employeeId', employee.id)
    assert.lengthOf(experiences, 1)
    const [experience] = experiences
    assert.equal(experience.title, 'Chef de projet')
    assert.equal(experience.company, 'ACME')
    assert.equal(experience.type, EXPERIENCES_TYPES.CDI)
    assert.equal(experience.startDate.toISODate(), '2018-01-15')
    assert.equal(experience.endDate?.toISODate(), '2021-12-31')
    assert.isFalse(experience.isCurrent)
    assert.equal(experience.description, 'Pilotage de projets SI')
  })

  test('expérience en cours : isCurrent null est stocké à false', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()

    await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ endDate: null, isCurrent: null, description: null }))
      .redirects(0)

    const experience = await Experience.query().where('employeeId', employee.id).firstOrFail()
    assert.isNull(experience.endDate)
    // `isCurrent || false`
    assert.isFalse(experience.isCurrent)
    assert.isNull(experience.description)
  })

  test('refuse un payload vide sur chaque champ requis', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client.post(URL).loginAs(user).json({}).redirects(0)

    assertFieldErrors(assert, response, [
      'title',
      'company',
      'type',
      'startDate',
      'endDate',
      'isCurrent',
      'description',
    ])
    assert.lengthOf(await Experience.all(), 0)
  })

  test('refuse un type de contrat hors énumération', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ type: 'stage' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['type'])
    assert.lengthOf(await Experience.all(), 0)
  })

  test('refuse une date de début future et une date de fin antérieure au début', async ({
    client,
    assert,
  }) => {
    const { user } = await createCandidate()

    const future = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ startDate: '2999-01-01', endDate: null }))
      .redirects(0)
    assertFieldErrors(assert, future, ['startDate'])

    const reversed = await client
      .post(URL)
      .loginAs(user)
      .json(validPayload({ startDate: '2020-01-01', endDate: '2019-01-01' }))
      .redirects(0)
    assertFieldErrors(assert, reversed, ['endDate'])

    assert.lengthOf(await Experience.all(), 0)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client, assert }) => {
    const response = await client.post(URL).json(validPayload()).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.lengthOf(await Experience.all(), 0)
  })
})

test.group('Candidat — expériences : modification (PUT)', (group) => {
  group.each.setup(() => truncateDb())

  test("met à jour l'expérience et redirige vers le profil", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({ employeeId: employee.id }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(
        validPayload({
          id: experience.id,
          title: 'Directeur technique',
          company: 'Globex',
          type: EXPERIENCES_TYPES.FREELANCE,
          endDate: null,
          isCurrent: true,
        })
      )
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)

    await experience.refresh()
    assert.equal(experience.title, 'Directeur technique')
    assert.equal(experience.company, 'Globex')
    assert.equal(experience.type, EXPERIENCES_TYPES.FREELANCE)
    assert.isNull(experience.endDate)
    assert.isTrue(experience.isCurrent)
    assert.equal(experience.employeeId, employee.id)
  })

  test('refuse un payload sans id', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({
      employeeId: employee.id,
      title: 'Original',
    }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(validPayload({ title: 'Modifié' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['id'])
    await experience.refresh()
    assert.equal(experience.title, 'Original')
  })

  test('refuse un type invalide sans modifier la ligne', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({
      employeeId: employee.id,
      type: EXPERIENCES_TYPES.CDD,
    }).create()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(validPayload({ id: experience.id, type: 'benevolat' }))
      .redirects(0)

    assertFieldErrors(assert, response, ['type'])
    await experience.refresh()
    assert.equal(experience.type, EXPERIENCES_TYPES.CDD)
  })

  test('une expérience inexistante répond 404', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client
      .put(URL)
      .loginAs(user)
      .json(validPayload({ id: 999_999 }))
      .redirects(0)

    response.assertStatus(404)
  })
})

test.group('Candidat — expériences : suppression (DELETE)', (group) => {
  group.each.setup(() => truncateDb())

  test("supprime l'expérience et redirige vers le profil", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({ employeeId: employee.id }).create()
    const kept = await ExperienceFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).loginAs(user).json({ id: experience.id }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.isNull(await Experience.find(experience.id))
    assert.isNotNull(await Experience.find(kept.id))
  })

  test('refuse un id non numérique', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await ExperienceFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).loginAs(user).json({ id: 'abc' }).redirects(0)

    assertFieldErrors(assert, response, ['id'])
    assert.lengthOf(await Experience.all(), 1)
  })

  test('une expérience inexistante répond 404', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.delete(URL).loginAs(user).json({ id: 999_999 }).redirects(0)

    response.assertStatus(404)
  })

  test('redirige un visiteur non connecté vers la connexion', async ({ client, assert }) => {
    const { employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({ employeeId: employee.id }).create()

    const response = await client.delete(URL).json({ id: experience.id }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    assert.isNotNull(await Experience.find(experience.id))
  })
})

test.group('Candidat — expériences : rôle', (group) => {
  group.each.setup(() => truncateDb())

  test('un conseiller est refusé (403) par le middleware candidate()', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()

    const response = await client.post(URL).loginAs(advisor).json(validPayload()).redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await Experience.all(), 0)
  })

  test("un conseiller d'une autre organisation ne peut pas supprimer une expérience", async ({
    client,
    assert,
  }) => {
    const { employee } = await createCandidate()
    const experience = await ExperienceFactory.merge({ employeeId: employee.id }).create()
    const advisor = await createAdvisor()

    const response = await client
      .delete(URL)
      .loginAs(advisor)
      .json({ id: experience.id })
      .redirects(0)

    response.assertStatus(403)
    assert.isNotNull(await Experience.find(experience.id))
  })
})

/**
 * Non-régression IDOR : cf. `educations.spec.ts`. Une expérience d'un autre
 * candidat doit être introuvable (404), et rester intacte.
 */
test.group('Candidat — expériences : isolation entre candidats', (group) => {
  group.each.setup(() => truncateDb())

  test("ne modifie pas l'expérience d'un autre candidat (404)", async ({ client, assert }) => {
    const { user: attacker } = await createCandidate()
    const { employee: victim } = await createCandidate()
    const experience = await ExperienceFactory.merge({
      employeeId: victim.id,
      title: 'Comptable',
    }).create()

    const response = await client
      .put(URL)
      .loginAs(attacker)
      .json(validPayload({ id: experience.id, title: 'HACK' }))
      .redirects(0)

    response.assertStatus(404)
    await experience.refresh()
    assert.equal(experience.title, 'Comptable')
    assert.equal(experience.employeeId, victim.id)
  })

  test("ne supprime pas l'expérience d'un autre candidat (404)", async ({ client, assert }) => {
    const { user: attacker } = await createCandidate()
    const { employee: victim } = await createCandidate()
    const experience = await ExperienceFactory.merge({ employeeId: victim.id }).create()

    const response = await client
      .delete(URL)
      .loginAs(attacker)
      .json({ id: experience.id })
      .redirects(0)

    response.assertStatus(404)
    assert.isNotNull(await Experience.find(experience.id))
  })
})
