import { test } from '@japa/runner'
import { EmployeeSynthesisFactory } from '#database/factories/employee_synthesis_factory'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import { SupportPlanStepExerciseFactory } from '#database/factories/support_plan_step_exercise_factory'
import { SupportPlanStepFactory } from '#database/factories/support_plan_step_factory'
import type Employee from '#models/employee'
import { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import PdfExport from '#models/pdf_export'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { createB2cCandidate, createCandidate, createInHouseExpert } from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'

/**
 * Verrouillage serveur des résultats (#101) : pour un particulier B2C qui n'a
 * pas réglé le forfait, aucune réponse (`data`) ni analyse IA d'un exercice
 * payant ne figure dans les props Inertia, sur aucune page. Un B2C payé et un
 * candidat B2B reçoivent tout.
 */

const SECRET_ANSWER = 'reponse-confidentielle-disc'
const SECRET_ANALYSIS = 'analyse-ia-confidentielle'
const FREE_ANSWER = 'reponse-motivation-gratuite'
const FREE_ANALYSIS = 'analyse-motivation-gratuite'

async function seedResults(employee: Employee) {
  await ExerciseResultFactory.merge({
    employeeId: employee.id,
    type: EXERCICE_RESULTS_TYPES.DISC,
    status: exerciceResultStatusValues.COMPLETED,
    data: { profile: 'D', answer: SECRET_ANSWER },
    quantitativeScore: 77,
    qualitativeAnalysis: SECRET_ANALYSIS,
  }).create()
  await ExerciseResultFactory.merge({
    employeeId: employee.id,
    type: EXERCICE_RESULTS_TYPES.MOTIVATION,
    status: exerciceResultStatusValues.COMPLETED,
    data: { answer: FREE_ANSWER },
    quantitativeScore: 55,
    qualitativeAnalysis: FREE_ANALYSIS,
  }).create()
}

type ExercisePayload = {
  type: string
  data: Record<string, unknown>
  quantitativeScore: number
  qualitativeAnalysis?: string | null
  locked?: boolean
}

function byType(list: ExercisePayload[]) {
  return Object.fromEntries(list.map((e) => [String(e.type).toLowerCase(), e]))
}

/** La DISC est vide et marquée, la Motivation (gratuite) intacte. */
function assertLockedPayload(assert: any, props: unknown, exercises: ExercisePayload[]) {
  const json = JSON.stringify(props)
  assert.notInclude(json, SECRET_ANSWER)
  assert.notInclude(json, SECRET_ANALYSIS)
  assert.include(json, FREE_ANSWER)
  assert.include(json, FREE_ANALYSIS)
  const map = byType(exercises)
  assert.deepEqual(map.disc.data, {})
  assert.equal(map.disc.quantitativeScore, 0)
  assert.isTrue(map.disc.locked)
  assert.notProperty(map.disc, 'qualitativeAnalysis')
  assert.equal(map.motivation.quantitativeScore, 55)
  assert.isUndefined(map.motivation.locked)
}

function assertOpenPayload(assert: any, props: unknown, exercises: ExercisePayload[]) {
  const json = JSON.stringify(props)
  assert.include(json, SECRET_ANSWER)
  assert.include(json, SECRET_ANALYSIS)
  const map = byType(exercises)
  assert.equal(map.disc.quantitativeScore, 77)
  assert.isUndefined(map.disc.locked)
}

test.group('Verrouillage des résultats (#101) — accueil', (group) => {
  group.each.setup(() => truncateDb())

  test('B2C non payé : la DISC est expurgée, la Motivation gratuite reste visible', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()
    await seedResults(employee)

    const response = await client.get('/dashboard/candidat').loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/home/Home')
    assertLockedPayload(
      assert,
      props,
      (props.employee as { exercises: ExercisePayload[] }).exercises
    )
  })

  test('B2C payé et B2B : tout est visible', async ({ client, assert }) => {
    for (const actor of [await createB2cCandidate({ paid: true }), await createCandidate()]) {
      await seedResults(actor.employee)

      const response = await client.get('/dashboard/candidat').loginAs(actor.user).withInertia()

      const props = assertPage(assert, response, 'dashboard/employee/home/Home')
      assertOpenPayload(
        assert,
        props,
        (props.employee as { exercises: ExercisePayload[] }).exercises
      )
    }
  })
})

test.group('Verrouillage des résultats (#101) — page d’exercice et profil', (group) => {
  group.each.setup(() => truncateDb())

  test('page d’un exercice gratuit : les autres résultats du payload sont expurgés', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()
    await seedResults(employee)

    const response = await client
      .get(`/dashboard/candidat/exercises/${EXERCICE_RESULTS_TYPES.MOTIVATION}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/exercises/Home')
    assert.isTrue(props.accessGranted)
    assertLockedPayload(
      assert,
      props,
      (props.employee as { exercises: ExercisePayload[] }).exercises
    )
  })

  test('page d’un exercice verrouillé : aucun pré-remplissage, payload expurgé', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()
    await seedResults(employee)

    const response = await client
      .get(`/dashboard/candidat/exercises/${EXERCICE_RESULTS_TYPES.DISC}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/exercises/Home')
    assert.isFalse(props.accessGranted)
    assert.deepEqual(props.initialDraftsByType, {})
    assert.notInclude(JSON.stringify(props), SECRET_ANSWER)
  })

  test('profil du particulier : expurgé non payé, complet payé', async ({ client, assert }) => {
    const unpaid = await createB2cCandidate()
    await seedResults(unpaid.employee)
    const paid = await createB2cCandidate({ paid: true })
    await seedResults(paid.employee)

    const lockedResponse = await client
      .get('/dashboard/candidat/profile')
      .loginAs(unpaid.user)
      .withInertia()
    const lockedProps = assertPage(assert, lockedResponse, 'dashboard/employee/profile/Home')
    assertLockedPayload(
      assert,
      lockedProps,
      (lockedProps.employee as { exercises: ExercisePayload[] }).exercises
    )

    const openResponse = await client
      .get('/dashboard/candidat/profile')
      .loginAs(paid.user)
      .withInertia()
    const openProps = assertPage(assert, openResponse, 'dashboard/employee/profile/Home')
    assertOpenPayload(
      assert,
      openProps,
      (openProps.employee as { exercises: ExercisePayload[] }).exercises
    )
  })

  test('étape assignée par un expert : résultats verrouillés tant que non payé', async ({
    client,
    assert,
  }) => {
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ expert })
    await seedResults(employee)
    const step = await SupportPlanStepFactory.merge({
      employeeId: employee.id,
      advisorId: expert.id,
    }).create()
    for (const [index, type] of [
      EXERCICE_RESULTS_TYPES.DISC,
      EXERCICE_RESULTS_TYPES.MOTIVATION,
    ].entries()) {
      await SupportPlanStepExerciseFactory.merge({
        supportPlanStepId: step.id,
        exerciseType: type,
        sortOrder: index,
      }).create()
    }

    const response = await client
      .get(`/dashboard/candidat/steps/${step.id}`)
      .loginAs(user)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/candidat/StepDetail', ['step', 'results'])
    assertLockedPayload(assert, props, props.results as ExercisePayload[])
  })
})

test.group('Verrouillage des résultats (#101) — synthèse et PDF', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('B2C non payé : synthèse verrouillée « payment », même partagée par un expert', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate()
    await seedResults(employee)
    await EmployeeSynthesisFactory.merge({
      organizationId: employee.organizationId,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      expertCommentsShared: 'Commentaire confidentiel',
    }).create()

    const response = await client.get('/dashboard/candidat/synthesis').loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/candidat/Synthesis', ['lockedReason'])
    assert.isFalse(props.shared)
    assert.equal(props.lockedReason, EXERCISE_LOCK_REASONS.PAYMENT)
    assert.isNull(props.employee)
    assert.isNull(props.synthesis)
    assert.notInclude(JSON.stringify(props), 'Commentaire confidentiel')
    assert.notInclude(JSON.stringify(props), SECRET_ANSWER)
  })

  test('B2C payé : synthèse visible sans partage par un conseiller', async ({ client, assert }) => {
    const { user, employee } = await createB2cCandidate({ paid: true })
    await seedResults(employee)

    const response = await client.get('/dashboard/candidat/synthesis').loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/candidat/Synthesis')
    assert.isTrue(props.shared)
    assert.isNull(props.lockedReason)
    const synthesis = props.synthesis as Record<string, unknown>
    assert.equal(synthesis.shareStatus, EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT)
    assert.notProperty(synthesis, 'expertNotesInternal')
    assert.include(JSON.stringify(props), SECRET_ANSWER)
  })

  test('B2B non partagée : toujours « non partagée », sans motif de paiement', async ({
    client,
    assert,
  }) => {
    const { user } = await createCandidate()

    const response = await client.get('/dashboard/candidat/synthesis').loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/candidat/Synthesis')
    assert.isFalse(props.shared)
    assert.isNull(props.lockedReason)
  })

  test('POST pdf : refusé (403) pour un B2C non payé, rien n’est créé', async ({
    client,
    assert,
  }) => {
    const { user } = await createB2cCandidate()

    const inertia = await client
      .post('/dashboard/candidat/synthesis/pdf')
      .loginAs(user)
      .withInertia()
      .header('referer', '/dashboard/candidat/synthesis')
      .redirects(0)
    inertia.assertStatus(302)
    inertia.assertHeader('location', '/dashboard/candidat/synthesis')
    inertia.assertFlashMessage('error', 'La synthèse et son export PDF sont réservés au forfait.')

    const json = await client
      .post('/dashboard/candidat/synthesis/pdf')
      .loginAs(user)
      .header('Accept', 'application/json')
      .redirects(0)
    json.assertStatus(403)

    assert.lengthOf(await PdfExport.all(), 0)
  })

  test('POST pdf : autorisé pour un B2C payé sans partage, le PDF est généré', async ({
    client,
    assert,
  }) => {
    const { user, employee } = await createB2cCandidate({ paid: true })

    const response = await client
      .post('/dashboard/candidat/synthesis/pdf')
      .loginAs(user)
      .header('referer', '/dashboard/candidat/synthesis')
      .redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', 'Génération PDF lancée.')
    const [pdfExport] = await PdfExport.query().where('employeeId', employee.id)
    assert.equal(pdfExport.status, PDF_EXPORT_STATUSES.COMPLETED)
  })

  test('téléchargement : 404 pour un B2C dont le droit a disparu, 200 payé', async ({ client }) => {
    const paid = await createB2cCandidate({ paid: true })
    const unpaid = await createB2cCandidate()
    for (const actor of [paid, unpaid]) {
      const pdfExport = await PdfExportFactory.merge({
        userId: actor.user.id,
        organizationId: actor.employee.organizationId,
        employeeId: actor.employee.id,
        status: PDF_EXPORT_STATUSES.COMPLETED,
        fileName: 'Synthese.pdf',
        mimeType: 'application/pdf',
      }).create()
      const key = pdfExportKey(actor.employee.organizationId, pdfExport.id)
      await storePdf(key, new TextEncoder().encode('%PDF-1.4 fake'))
      pdfExport.filePath = key
      await pdfExport.save()

      const response = await client
        .get(`/dashboard/pdf-exports/${pdfExport.id}/download`)
        .loginAs(actor.user)
        .redirects(0)
      response.assertStatus(actor === paid ? 200 : 404)
    }
  })
})
