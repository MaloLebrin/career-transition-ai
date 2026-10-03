import { test } from '@japa/runner'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { SupportPlanStepExerciseFactory } from '#database/factories/support_plan_step_exercise_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import type Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Notification from '#models/notification'
import SupportPlanStep from '#models/support_plan_step'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultStatusValues,
  type ExerciceResultType,
} from '#shared/constants/exercises'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { B2C_FREE_EXERCISE_TYPES, EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import { orderExercisesForB2c } from '#shared/helpers/b2c_access'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createOrganization,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { assertFieldErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { DateTime } from 'luxon'

/**
 * Exercices du candidat (`ExerciseResultsController`, routes candidat) :
 * - `GET  /dashboard/candidat/exercises`               → liste ;
 * - `GET  /dashboard/candidat/exercises/:type`         → exercice ;
 * - `POST /dashboard/candidat/exercises/:type/draft`   → brouillon ;
 * - `POST /dashboard/candidat/exercises/:type/result`  → résultat.
 *
 * Règle d'accès : un exercice n'est accessible que s'il est rattaché à au
 * moins une étape **déverrouillée** du plan d'accompagnement du candidat.
 */

const BASE = '/dashboard/candidat/exercises'
const LIST_PAGE = 'dashboard/employee/exercises/List'
const EXERCISE_PAGE = 'dashboard/employee/exercises/Home'
const LOCKED_MESSAGE = 'Cette étape est verrouillée. Contactez votre conseiller pour la débloquer.'
const PAYMENT_LOCKED_MESSAGE =
  'Cet exercice fait partie du forfait. Débloquez vos résultats pour y accéder.'

/** Étape du plan portant `types`, verrouillée ou non. */
async function planStep(
  employee: Employee,
  types: ExerciceResultType[],
  options: { isLocked?: boolean } = {}
): Promise<SupportPlanStep> {
  const step = await SupportPlanStepFactory.merge({
    employeeId: employee.id,
    advisorId: employee.advisorId,
    isLocked: options.isLocked ?? false,
    completed: false,
  }).create()
  for (const [index, exerciseType] of types.entries()) {
    await SupportPlanStepExerciseFactory.merge({
      supportPlanStepId: step.id,
      exerciseType,
      sortOrder: index,
    }).create()
  }
  return step
}

function resultPayload(overrides: Record<string, unknown> = {}) {
  return {
    type: EXERCICE_RESULTS_TYPES.MOTIVATION,
    status: exerciceResultStatusValues.COMPLETED,
    date: '2026-01-15T10:00:00.000Z',
    duration: 420,
    data: { step: 2, answers: { autonomie: 5 } },
    quantitativeScore: 80,
    plan: [],
    ...overrides,
  }
}

test.group('Candidat — exercices : liste (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('liste le catalogue, les exercices déverrouillés et ceux terminés', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION, EXERCICE_RESULTS_TYPES.VALUES])
    await planStep(employee, [EXERCICE_RESULTS_TYPES.DISC], { isLocked: true })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
    }).create()
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.DRAFT,
      date: DateTime.now(),
    }).create()

    const response = await client.get(BASE).loginAs(user).withInertia()

    const props = assertPage(assert, response, LIST_PAGE, [
      'exercises',
      'unlockedExerciseSlugs',
      'completedExerciseSlugs',
    ])
    assert.lengthOf(props.exercises as unknown[], EXERCISE_LIST.length)
    assert.sameMembers(props.unlockedExerciseSlugs as string[], [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
      EXERCICE_RESULTS_TYPES.VALUES,
    ])
    assert.deepEqual(props.completedExerciseSlugs, [EXERCICE_RESULTS_TYPES.MOTIVATION])
  })

  test("n'expose pas le plan d'un autre candidat", async ({ client, assert }) => {
    const { user } = await createCandidate()
    const other = await createCandidate()
    await planStep(other.employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const response = await client.get(BASE).loginAs(user).withInertia()

    const props = assertPage(assert, response, LIST_PAGE)
    assert.deepEqual(props.unlockedExerciseSlugs, [])
    assert.deepEqual(props.completedExerciseSlugs, [])
  })

  test("renvoie vers l'onboarding un candidat non onboardé", async ({ client }) => {
    const { user } = await createCandidate({ onboarded: false })

    const response = await client.get(BASE).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat/onboarding')
  })

  test('refuse un conseiller (403)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(BASE).loginAs(advisor).redirects(0)

    response.assertStatus(403)
  })
})

test.group('Candidat — exercices : page exercice (GET)', (group) => {
  group.each.setup(() => truncateDb())

  test('exercice verrouillé : page bloquée, sans brouillon', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION], { isLocked: true })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.DRAFT,
      data: { step: 1 },
    }).create()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE, [
      'type',
      'employee',
      'initialDraftsByType',
      'accessGranted',
      'blockedMessage',
    ])
    assert.isFalse(props.accessGranted)
    assert.equal(props.blockedMessage, LOCKED_MESSAGE)
    assert.deepEqual(props.initialDraftsByType, {})
  })

  test('la page exercice ne transmet jamais advisorNotes au candidat', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    employee.advisorNotes = 'Note confidentielle du conseiller'
    await employee.save()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE, ['employee'])
    assert.notProperty(props.employee as object, 'advisorNotes')
    assert.notInclude(JSON.stringify(props), 'Note confidentielle du conseiller')
  })

  test('exercice absent du plan : page bloquée elle aussi', async ({ client, assert }) => {
    const { user } = await createCandidate()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE)
    assert.isFalse(props.accessGranted)
  })

  test('exercice déverrouillé sans historique : brouillon nul, progression 0', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE, [
      'type',
      'employee',
      'initialDraftsByType',
      'accessGranted',
      'exerciseProgressPercent',
    ])
    assert.isTrue(props.accessGranted)
    assert.equal(props.type, EXERCICE_RESULTS_TYPES.VALUES)
    assert.deepEqual(props.initialDraftsByType, { [EXERCICE_RESULTS_TYPES.VALUES]: null })
    assert.equal(props.exerciseProgressPercent, 0)
  })

  test('reprend le brouillon en cours', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.DRAFT,
      date: null,
      data: { step: 1, answers: { autonomie: 3 } },
    }).create()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE)
    const drafts = props.initialDraftsByType as Record<
      string,
      { employeeId: number; type: string; data: Record<string, unknown> }
    >
    const draft = drafts[EXERCICE_RESULTS_TYPES.MOTIVATION]
    assert.equal(draft.employeeId, employee.id)
    assert.equal(draft.type, EXERCICE_RESULTS_TYPES.MOTIVATION)
    assert.deepEqual(draft.data, { step: 1, answers: { autonomie: 3 } })
  })

  test("sans brouillon, pré-remplit depuis le résultat terminé à l'étape 2", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.DISC])
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      data: { step: 1, profile: 'D' },
    }).create()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE)
    const drafts = props.initialDraftsByType as Record<string, { data: Record<string, unknown> }>
    assert.deepEqual(drafts[EXERCICE_RESULTS_TYPES.DISC].data, { step: 2, profile: 'D' })
    assert.equal(props.exerciseProgressPercent, 100)
  })

  test("le type d'URL est insensible à la casse", async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])

    const response = await client.get(`${BASE}/VALUES`).loginAs(user).withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE)
    assert.isTrue(props.accessGranted)
  })
})

test.group('Candidat — exercices : brouillon (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre le brouillon puis revient à la page précédente', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])
    const page = `${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}`

    const response = await client
      .post(`${page}/draft`)
      .loginAs(user)
      .header('referer', page)
      .json({
        employeeId: String(employee.id),
        type: EXERCICE_RESULTS_TYPES.VALUES,
        data: { step: 1, selected: ['Autonomie'] },
      })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', page)

    const draft = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.VALUES)
      .firstOrFail()
    assert.equal(draft.status, exerciceResultStatusValues.DRAFT)
    assert.deepEqual(draft.data, { step: 1, selected: ['Autonomie'] })
  })

  test('un second brouillon met à jour le premier sans doublon', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])
    const url = `${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`
    const body = (data: Record<string, unknown>) => ({
      employeeId: String(employee.id),
      type: EXERCICE_RESULTS_TYPES.VALUES,
      data,
    })

    await client
      .post(url)
      .loginAs(user)
      .json(body({ step: 1 }))
      .redirects(0)
    await client
      .post(url)
      .loginAs(user)
      .json(body({ step: 2 }))
      .redirects(0)

    const rows = await ExerciseResult.query().where('employeeId', employee.id)
    assert.lengthOf(rows, 1)
    assert.deepEqual(rows[0].data, { step: 2 })
  })

  test('écrit sur la fiche du candidat connecté, quel que soit employeeId', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const other = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])

    await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`)
      .loginAs(user)
      .json({
        employeeId: String(other.employee.id),
        type: EXERCICE_RESULTS_TYPES.VALUES,
        data: { step: 1 },
      })
      .redirects(0)

    assert.lengthOf(await ExerciseResult.query().where('employeeId', other.employee.id), 0)
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 1)
  })

  test("exercice verrouillé : rien n'est écrit, retour à l'exercice avec une erreur", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES], { isLocked: true })

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`)
      .loginAs(user)
      .json({
        employeeId: String(employee.id),
        type: EXERCICE_RESULTS_TYPES.VALUES,
        data: { step: 1 },
      })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}`)
    response.assertFlashMessage('error', 'Cette étape est verrouillée.')
    assert.lengthOf(await ExerciseResult.all(), 0)
  })

  test('refuse un payload invalide', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}/draft`)
      .loginAs(user)
      .json({ type: 'inconnu' })
      .redirects(0)

    assertFieldErrors(assert, response, ['employeeId', 'type', 'data'])
    assert.lengthOf(await ExerciseResult.all(), 0)
  })
})

test.group('Candidat — exercices : résultat (POST)', (group) => {
  group.each.setup(() => truncateDb())

  test('enregistre le résultat terminé, notifie le conseiller et complète l’étape', async ({
    client,
    assert,
  }) => {
    const organization = await createOrganization()
    const advisor = await createAdvisor(organization)
    const { user, employee } = await createCandidate({ organization, advisor })
    const step = await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload())
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
    response.assertFlashMessage(
      'success',
      "Exercice Motivation enregistré. L'analyse IA se prépare en arrière-plan."
    )

    const result = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .firstOrFail()
    assert.equal(result.status, exerciceResultStatusValues.COMPLETED)
    assert.equal(result.duration, 420)
    assert.equal(result.quantitativeScore, 80)
    assert.equal(result.date?.toISODate(), '2026-01-15')

    const notification = await Notification.query()
      .where('userId', advisor.id)
      .where('type', NOTIFICATION_TYPES.EXERCISE_COMPLETED)
      .first()
    assert.isNotNull(notification)

    await step.refresh()
    assert.isTrue(step.completed)
  })

  test('un résultat terminé remplace le brouillon existant', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.VALUES])
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      status: exerciceResultStatusValues.DRAFT,
      data: { step: 1 },
    }).create()

    await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}/result`)
      .loginAs(user)
      .json(resultPayload({ type: EXERCICE_RESULTS_TYPES.VALUES, data: { step: 2 } }))
      .redirects(0)

    const rows = await ExerciseResult.query().where('employeeId', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].status, exerciceResultStatusValues.COMPLETED)
    assert.deepEqual(rows[0].data, { step: 2 })
  })

  test("l'étape reste incomplète tant que tous ses exercices ne sont pas terminés", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    const step = await planStep(employee, [
      EXERCICE_RESULTS_TYPES.MOTIVATION,
      EXERCICE_RESULTS_TYPES.VALUES,
    ])

    await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      // Un plan forgé côté client ne doit pas compter.
      .json(resultPayload({ plan: [{ id: step.id, completed: true }] }))
      .redirects(0)

    await step.refresh()
    assert.isFalse(step.completed)
  })

  test("exercice verrouillé : rien n'est écrit, retour à l'exercice avec une erreur", async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION], { isLocked: true })

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload())
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
    response.assertFlashMessage('error', 'Cette étape est verrouillée.')
    assert.lengthOf(await ExerciseResult.all(), 0)
  })

  test('refuse un statut, un type et une durée invalides', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload({ type: 'inconnu', status: 'archived', duration: -1 }))
      .redirects(0)

    assertFieldErrors(assert, response, ['type', 'status', 'duration'])
    assert.lengthOf(await ExerciseResult.all(), 0)
  })

  test('refuse un payload sans plan ni données', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    await planStep(employee, [EXERCICE_RESULTS_TYPES.MOTIVATION])

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload({ plan: undefined, data: undefined }))
      .redirects(0)

    assertFieldErrors(assert, response, ['plan', 'data'])
  })

  test('refuse un conseiller (403)', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(advisor)
      .json(resultPayload())
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await ExerciseResult.all(), 0)
  })
})

/**
 * Particuliers B2C (#100) : Motivations et Valeurs gratuits sans plan
 * d'accompagnement, le reste verrouillé tant que le forfait n'est pas réglé.
 * L'analyse IA (queue `sync`, fournisseur `none`) n'est lancée que si autorisée.
 */
test.group('Candidat B2C — exercices (#100)', (group) => {
  group.each.setup(() => truncateDb())

  test('liste : gratuits d’abord, seuls déverrouillés sans paiement, verrou « payment »', async ({
    client,
    assert,
  }) => {
    const { user } = await createB2cCandidate()

    const response = await client.get(BASE).loginAs(user).withInertia()

    const props = assertPage(assert, response, LIST_PAGE, [
      'exercises',
      'unlockedExerciseSlugs',
      'completedExerciseSlugs',
      'lockedReason',
      'accountType',
      'exerciseAccess',
    ])
    assert.deepEqual(
      (props.exercises as Array<{ slug: string }>).map((e) => e.slug),
      orderExercisesForB2c(EXERCISE_LIST, B2C_FREE_EXERCISE_TYPES).map((e) => e.slug)
    )
    assert.deepEqual(props.unlockedExerciseSlugs, [...B2C_FREE_EXERCISE_TYPES])
    assert.equal(props.lockedReason, EXERCISE_LOCK_REASONS.PAYMENT)
    assert.equal(props.accountType, 'b2c')
    const access = props.exerciseAccess as { hasPaidAccess: boolean; freeExerciseTypes: string[] }
    assert.isFalse(access.hasPaidAccess)
    assert.deepEqual(access.freeExerciseTypes, [...B2C_FREE_EXERCISE_TYPES])
  })

  test('liste : tout le catalogue une fois le forfait réglé', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ paid: true })

    const response = await client.get(BASE).loginAs(user).withInertia()

    const props = assertPage(assert, response, LIST_PAGE)
    assert.sameMembers(
      props.unlockedExerciseSlugs as string[],
      EXERCISE_LIST.map((e) => e.slug)
    )
    assert.isTrue((props.exerciseAccess as { hasPaidAccess: boolean }).hasPaidAccess)
  })

  test('exercice gratuit : accessible sans plan d’accompagnement', async ({ client, assert }) => {
    const { user } = await createB2cCandidate()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.VALUES}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE, ['exerciseAccess'])
    assert.isTrue(props.accessGranted)
    assert.deepEqual(props.initialDraftsByType, { [EXERCICE_RESULTS_TYPES.VALUES]: null })
  })

  test('exercice du forfait non payé : page bloquée avec le motif « payment »', async ({
    client,
    assert,
  }) => {
    const { user } = await createB2cCandidate()

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE, ['lockedReason', 'blockedMessage'])
    assert.isFalse(props.accessGranted)
    assert.equal(props.lockedReason, EXERCISE_LOCK_REASONS.PAYMENT)
    assert.equal(props.blockedMessage, PAYMENT_LOCKED_MESSAGE)
    assert.deepEqual(props.initialDraftsByType, {})
  })

  test('exercice du forfait payé : accessible', async ({ client, assert }) => {
    const { user } = await createB2cCandidate({ paid: true })

    const response = await client
      .get(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, EXERCISE_PAGE)
    assert.isTrue(props.accessGranted)
  })

  test('brouillon et résultat refusés sur un exercice du forfait non payé', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()

    const draft = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}/draft`)
      .loginAs(user)
      .json({
        employeeId: String(employee.id),
        type: EXERCICE_RESULTS_TYPES.DISC,
        data: { step: 1 },
      })
      .redirects(0)
    draft.assertStatus(302)
    draft.assertHeader('location', `${BASE}/${EXERCICE_RESULTS_TYPES.DISC}`)
    draft.assertFlashMessage('error', 'Cet exercice fait partie du forfait.')

    const result = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}/result`)
      .loginAs(user)
      .json(resultPayload({ type: EXERCICE_RESULTS_TYPES.DISC }))
      .redirects(0)
    result.assertStatus(302)
    result.assertFlashMessage('error', 'Cet exercice fait partie du forfait.')

    assert.lengthOf(await ExerciseResult.all(), 0)
  })

  test('exercice gratuit terminé : enregistré, analysé une fois, le particulier est notifié', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()

    const first = await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload())
      .redirects(0)
    first.assertStatus(302)
    first.assertHeader('location', '/dashboard/candidat')

    const stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.MOTIVATION)
      .firstOrFail()
    assert.equal(stored.status, exerciceResultStatusValues.COMPLETED)
    // Queue `sync` + fournisseur `none` : l'analyse est produite dans la foulée.
    assert.isNotNull(stored.qualitativeAnalysis)
    const firstAnalysis = stored.qualitativeAnalysis
    assert.lengthOf(
      await Notification.query()
        .where('userId', user.id)
        .where('type', NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE),
      1
    )

    // Une relance ne déclenche pas de seconde analyse (ni de seconde notification).
    stored.qualitativeAnalysis = 'Analyse déjà produite'
    await stored.save()
    await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.MOTIVATION}/result`)
      .loginAs(user)
      .json(resultPayload({ data: { step: 2, answers: { autonomie: 1 } } }))
      .redirects(0)

    await stored.refresh()
    assert.equal(stored.qualitativeAnalysis, 'Analyse déjà produite')
    assert.notEqual(stored.qualitativeAnalysis, firstAnalysis)
    assert.lengthOf(
      await Notification.query()
        .where('userId', user.id)
        .where('type', NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE),
      1
    )
  })

  test('forfait payé : l’analyse IA est relancée à chaque résultat', async ({ client, assert }) => {
    const { user, employee } = await createB2cCandidate({ paid: true })
    await ExerciseResultFactory.merge({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.DISC,
      status: exerciceResultStatusValues.COMPLETED,
      qualitativeAnalysis: 'Ancienne analyse',
    }).create()

    await client
      .post(`${BASE}/${EXERCICE_RESULTS_TYPES.DISC}/result`)
      .loginAs(user)
      .json(resultPayload({ type: EXERCICE_RESULTS_TYPES.DISC }))
      .redirects(0)

    const stored = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('type', EXERCICE_RESULTS_TYPES.DISC)
      .firstOrFail()
    assert.notEqual(stored.qualitativeAnalysis, 'Ancienne analyse')
  })
})
