import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import {
  exerciceTypeToFront,
  mapEmployee,
  mapExerciseResult,
  mapSupportPlanStep,
} from '#mappers/employee_mapper'
import { EXERCICE_RESULTS_TYPES, exerciceResultTypesValues } from '#shared/constants/exercises'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'

/**
 * Les mappers ne lisent que des propriétés : des littéraux typés à la volée
 * suffisent, sans base de données.
 */
const baseEmployee = {
  id: 1,
  organizationId: 2,
  advisorId: null,
  name: 'Marie',
  email: 'marie@example.com',
  currentRole: 'Dev',
  targetRole: null,
  summary: null,
  advisorNotes: null,
  status: 'active',
  onboarded: true,
}

function experience(type: string | null) {
  return {
    id: 1,
    title: 'Poste',
    company: 'ACME',
    type,
    startDate: DateTime.fromISO('2020-01-01'),
    endDate: null,
    isCurrent: null,
    description: null,
  }
}

test.group('employee_mapper — conversions', () => {
  test('exerciceTypeToFront couvre chaque type et replie sur MOTIVATION', ({ assert }) => {
    for (const type of exerciceResultTypesValues) {
      assert.equal(exerciceTypeToFront(type), type.toUpperCase())
    }
    assert.equal(exerciceTypeToFront('inconnu' as any), 'MOTIVATION')
  })

  test('mapEmployee traduit les types de contrat vers les libellés front', ({ assert }) => {
    const types = [
      EXPERIENCES_TYPES.CDI,
      EXPERIENCES_TYPES.CDD,
      EXPERIENCES_TYPES.ALTERNANCE,
      EXPERIENCES_TYPES.FREELANCE,
      EXPERIENCES_TYPES.INDEPENDENT,
      EXPERIENCES_TYPES.INTERIM,
      null,
    ]
    const dto = mapEmployee({ ...baseEmployee, experiences: types.map(experience) } as any)

    assert.deepEqual(
      dto.experiences.map((e) => e.type),
      ['CDI', 'CDD', 'Alternance', 'Freelance', 'Freelance', undefined, undefined]
    )
    assert.isFalse(dto.experiences[0].isCurrent)
    assert.equal(dto.experiences[0].description, '')
    assert.isUndefined(dto.experiences[0].endDate)
  })

  test('mapEmployee convertit formations et valeurs nulles', ({ assert }) => {
    const dto = mapEmployee({
      ...baseEmployee,
      educations: [
        {
          id: 5,
          degree: 'Master',
          school: 'IAE',
          startDate: DateTime.fromISO('2015-09-01'),
          endDate: DateTime.fromISO('2017-06-30'),
          isCurrent: false,
          description: null,
        },
      ],
    } as any)

    assert.deepEqual(dto.educations, [
      {
        id: 5,
        degree: 'Master',
        school: 'IAE',
        startDate: '2015-09-01',
        endDate: '2017-06-30',
        isCurrent: false,
        description: '',
      },
    ])
    assert.isUndefined(dto.advisorId)
    assert.isUndefined(dto.targetRole)
    assert.isUndefined(dto.summary)
    assert.deepEqual(dto.skills, [])
    assert.deepEqual(dto.plan, [])
    assert.deepEqual(dto.exercises, [])
  })

  test('mapExerciseResult applique les valeurs par défaut', ({ assert }) => {
    const dto = mapExerciseResult({
      id: 3,
      type: EXERCICE_RESULTS_TYPES.VALUES,
      date: DateTime.fromISO('2026-01-02T00:00:00.000Z', { zone: 'utc' }),
      duration: null,
      data: { a: 1 },
      progressPercent: null,
      quantitativeScore: null,
      qualitativeAnalysis: null,
    } as any)

    assert.deepEqual(dto, {
      id: 3,
      type: 'VALUES',
      date: '2026-01-02T00:00:00.000Z',
      duration: 0,
      data: { a: 1 },
      progressPercent: undefined,
      quantitativeScore: 0,
      qualitativeAnalysis: undefined,
    })
  })

  test("mapExerciseResult date le résultat à maintenant quand il n'a pas de date", ({ assert }) => {
    const before = Date.now()
    const dto = mapExerciseResult({ id: 1, type: 'disc', date: null, data: {} } as any)
    assert.isAtLeast(new Date(dto.date).getTime(), before)
  })

  test('mapSupportPlanStep convertit dates et exercices associés', ({ assert }) => {
    const updatedAt = DateTime.fromISO('2026-03-01T08:00:00.000Z', { zone: 'utc' })
    const dto = mapSupportPlanStep({
      id: 9,
      title: 'Bilan',
      description: null,
      instructions: null,
      dueDate: DateTime.fromISO('2026-03-10'),
      scheduledAt: DateTime.fromISO('2026-03-10T09:00:00.000Z', { zone: 'utc' }),
      endedAt: DateTime.fromISO('2026-03-10T10:00:00.000Z', { zone: 'utc' }),
      status: 'completed',
      locationOrLink: null,
      completed: true,
      notes: null,
      exercises: [{ exerciseType: 'disc' }, { exerciseType: 'values' }],
      updatedAt,
      isLocked: false,
      sortOrder: null,
    } as any)

    assert.equal(dto.dueDate, '2026-03-10')
    assert.equal(dto.scheduledAt, '2026-03-10T09:00:00.000Z')
    assert.equal(dto.endedAt, '2026-03-10T10:00:00.000Z')
    assert.deepEqual(dto.associatedExercises, ['DISC', 'VALUES'])
    assert.equal(dto.lastUpdated, '2026-03-01T08:00:00.000Z')
    assert.isUndefined(dto.sortOrder)
    assert.isUndefined(dto.description)
  })

  test("mapSupportPlanStep n'expose pas de liste d'exercices vide", ({ assert }) => {
    const dto = mapSupportPlanStep({
      id: 1,
      status: 'scheduled',
      completed: false,
      dueDate: null,
      scheduledAt: null,
      endedAt: null,
      updatedAt: DateTime.now(),
      isLocked: true,
      sortOrder: 2,
    } as any)

    assert.isUndefined(dto.associatedExercises)
    assert.isUndefined(dto.dueDate)
    assert.isUndefined(dto.scheduledAt)
    assert.equal(dto.sortOrder, 2)
  })
})
