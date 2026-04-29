import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import { EmployeeSynthesisPdfService } from '#services/employee_synthesis_pdf_service'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#shared/constants/exercises'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import type { EmployeeDto } from '#dtos/employee_dto'

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildMinimalPayload() {
  return {
    employee: {
      id: 1,
      organizationId: 1,
      name: 'Jean Dupont',
      email: 'jean@example.com',
      currentRole: 'Développeur',
      targetRole: 'Lead Dev',
      skills: [],
      experiences: [],
      educations: [],
      exercises: [],
      plan: [],
      summary: undefined,
      advisorNotes: undefined,
      status: 'active' as EmployeeDto['status'],
      onboarded: true,
    },
    synthesis: {
      shareStatus: 'shared' as const,
      sharedAt: '2026-01-15T10:00:00.000Z',
      expertCommentsShared: null,
      executiveSummaryOverride: null,
    },
    latestCompletedByType: {},
  }
}

// ─── tests unitaires (in-memory) ──────────────────────────────────────────────

test.group('EmployeeSynthesisPdfService.generateShareablePdf — structure', () => {
  test('retourne un Uint8Array non vide', async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const result = await service.generateShareablePdf({ payload: buildMinimalPayload() })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })

  test('le binaire commence par les magic bytes PDF', async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const result = await service.generateShareablePdf({ payload: buildMinimalPayload() })
    const header = Buffer.from(result.slice(0, 5)).toString('ascii')
    assert.equal(header, '%PDF-')
  })

  test('le PDF est plus volumineux avec du contenu que sans', async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()

    const empty = await service.generateShareablePdf({ payload: buildMinimalPayload() })

    const payload = buildMinimalPayload()
    payload.synthesis.executiveSummaryOverride =
      'Résumé exécutif complet avec beaucoup de contenu pour augmenter la taille du document PDF généré'
    payload.synthesis.expertCommentsShared =
      'Commentaires expert détaillés sur le parcours du candidat avec recommandations approfondies'
    payload.employee.exercises = [
      {
        id: 1,
        type: 'MOTIVATION',
        date: '2026-01-10T00:00:00.000Z',
        duration: 30,
        data: {},
        quantitativeScore: 7,
        qualitativeAnalysis:
          'Analyse qualitative motivation très détaillée avec de nombreuses observations sur le profil motivationnel du candidat',
      },
    ]
    payload.latestCompletedByType = { motivation: 1 }
    const rich = await service.generateShareablePdf({ payload })

    assert.isAbove(rich.length, empty.length)
  })

  test("ne lance pas d'erreur avec des tableaux vides", async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const payload = buildMinimalPayload()
    const result = await service.generateShareablePdf({ payload })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })

  test("ne lance pas d'erreur avec executiveSummaryOverride renseigné", async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const payload = buildMinimalPayload()
    payload.synthesis.executiveSummaryOverride = 'Contenu du résumé exécutif'
    const result = await service.generateShareablePdf({ payload })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })

  test("ne lance pas d'erreur avec expertCommentsShared renseigné", async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const payload = buildMinimalPayload()
    payload.synthesis.expertCommentsShared = "Commentaires de l'expert partagés"
    const result = await service.generateShareablePdf({ payload })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })

  test('inclut un exercice quand il est dans latestCompletedByType — taille supérieure', async ({
    assert,
  }) => {
    const service = new EmployeeSynthesisPdfService()

    const withoutExercise = buildMinimalPayload()
    const resultWithout = await service.generateShareablePdf({ payload: withoutExercise })

    const withExercise = buildMinimalPayload()
    withExercise.employee.exercises = [
      {
        id: 42,
        type: 'MOTIVATION',
        date: '2026-01-10T00:00:00.000Z',
        duration: 30,
        data: {},
        quantitativeScore: 7,
        qualitativeAnalysis:
          'Analyse qualitative motivation détaillée servant à augmenter la taille du fichier',
      },
    ]
    withExercise.latestCompletedByType = { motivation: 42 }
    const resultWith = await service.generateShareablePdf({ payload: withExercise })

    assert.isAbove(resultWith.length, resultWithout.length)
  })

  test('ignore un exercice absent de latestCompletedByType — taille identique au payload vide', async ({
    assert,
  }) => {
    const service = new EmployeeSynthesisPdfService()

    const withoutExercise = buildMinimalPayload()
    const resultWithout = await service.generateShareablePdf({ payload: withoutExercise })

    const withUnmatchedExercise = buildMinimalPayload()
    withUnmatchedExercise.employee.exercises = [
      {
        id: 99,
        type: 'DISC',
        date: '2026-01-10T00:00:00.000Z',
        duration: 20,
        data: {},
        quantitativeScore: 5,
        qualitativeAnalysis: 'Analyse disc non incluse',
      },
    ]
    withUnmatchedExercise.latestCompletedByType = {}
    const resultUnmatched = await service.generateShareablePdf({ payload: withUnmatchedExercise })

    // Unmatched exercise doesn't add section content
    assert.equal(resultUnmatched.length, resultWithout.length)
  })

  test("ne lance pas d'erreur pour un exercice sans analyse qualitative", async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const payload = buildMinimalPayload()
    payload.employee.exercises = [
      {
        id: 77,
        type: 'VALUES',
        date: '2026-02-01T00:00:00.000Z',
        duration: 45,
        data: {},
        quantitativeScore: 8,
        qualitativeAnalysis: undefined,
      },
    ]
    payload.latestCompletedByType = { values: 77 }
    const result = await service.generateShareablePdf({ payload })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })

  test('un exercice DISC avec données augmente la taille du PDF', async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()

    const withoutExercise = buildMinimalPayload()
    const resultWithout = await service.generateShareablePdf({ payload: withoutExercise })

    const withDisc = buildMinimalPayload()
    withDisc.employee.exercises = [
      {
        id: 42,
        type: 'DISC',
        date: '2026-01-10T09:00:00.000Z',
        duration: 30,
        quantitativeScore: 0,
        qualitativeAnalysis: 'Profil très dominant avec forte influence.',
        data: { D: 8, I: 6, S: 4, C: 7 },
      } as any,
    ]
    withDisc.latestCompletedByType = { DISC: 42 }
    const resultWith = await service.generateShareablePdf({ payload: withDisc })

    assert.isAbove(resultWith.length, resultWithout.length)
  })

  test("les accents et caractères spéciaux ne lèvent pas d'erreur", async ({ assert }) => {
    const service = new EmployeeSynthesisPdfService()
    const payload = buildMinimalPayload()
    payload.employee.name = 'Éléonore Château'
    payload.employee.currentRole = 'Responsable RH'
    payload.employee.targetRole = 'Directrice générale'
    payload.synthesis.expertCommentsShared = 'Très bonne progression — avenir prometteur'
    const result = await service.generateShareablePdf({ payload })
    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 0)
  })
})

// ─── test d'intégration BDD ───────────────────────────────────────────────────

test.group('EmployeeSynthesisPdfService.generateShareablePdf — intégration BDD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('génère un PDF valide pour un dossier complet via EmployeeSynthesisService', async ({
    assert,
  }) => {
    const ts = Date.now()
    const org = await Organization.create({
      name: 'PDF Synth Org',
      slug: `pdf-synth-${ts}`,
      logoUrl: null,
    })
    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Candidate PDF Test',
      email: `pdf-test-${ts}@example.com`,
      currentRole: 'Analyste',
      targetRole: 'Product Manager',
      summary: 'Résumé de test pour la génération PDF',
      advisorNotes: null,
      status: 'active',
      onboarded: true,
    })
    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: null,
      sharedByUserId: null,
      expertCommentsShared: 'Bon candidat visible dans pdf',
      expertNotesInternal: 'Notes internes jamais visibles dans pdf',
      executiveSummaryOverride: 'Synthèse exécutive de test',
    })
    const exerciseResult = await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      date: null,
      duration: 45,
      data: {},
      quantitativeScore: 8,
      qualitativeAnalysis: 'Analyse qualitative motivation intégrée dans le PDF',
    })

    const synthesisService = new EmployeeSynthesisService()
    const payload = await synthesisService.buildForCandidate({
      organizationId: org.id,
      employeeId: employee.id,
    })

    // buildForCandidate strips expertNotesInternal at the type level
    assert.isUndefined((payload.synthesis as any).expertNotesInternal)

    const pdfService = new EmployeeSynthesisPdfService()
    const result = await pdfService.generateShareablePdf({ payload })

    assert.instanceOf(result, Uint8Array)
    assert.isAbove(result.length, 100)
    const header = Buffer.from(result.slice(0, 5)).toString('ascii')
    assert.equal(header, '%PDF-')

    // Exercise is tracked in latestCompletedByType
    assert.property(payload.latestCompletedByType, EXERCICE_RESULTS_TYPES.MOTIVATION)
    assert.equal(
      payload.latestCompletedByType[EXERCICE_RESULTS_TYPES.MOTIVATION],
      exerciseResult.id
    )
  })
})
