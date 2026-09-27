import { test } from '@japa/runner'
import { EXERCISE_LIST, EXERCICE_RESULTS_TYPES as T } from '#shared/constants/exercises'
import { getExerciseProgress, getExerciseProgressByType } from '#shared/helpers/exercise_progress'
import ExerciseResult from '#models/exercise_result'

test.group('getExerciseProgress — règles par exercice', () => {
  test('un exercice terminé vaut 100 % quelles que soient ses données', ({ assert }) => {
    assert.equal(getExerciseProgress(T.TARGETING, null, 'completed'), 100)
  })

  test('motivation : ratio des duels répondus dans la matrice (sur 231)', ({ assert }) => {
    const row0 = [null, ...Array.from({ length: 21 }, () => 1)]
    assert.equal(getExerciseProgress(T.MOTIVATION, { matrix: [row0] }), 9) // 21 / 231
  })

  test('motivation : repli sur la position du duel courant sans matrice', ({ assert }) => {
    // Duel n°22 (i = 1, j = 2) : 22 / 231.
    assert.equal(getExerciseProgress(T.MOTIVATION, { currentI: 1, currentJ: 2 }), 10)
    assert.equal(getExerciseProgress(T.MOTIVATION, {}), 0)
  })

  test('valeurs : 70 % pour 10 valeurs choisies, 30 % pour les 3 personnes', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.VALUES, {
        selectedValues: ['A', 'B', 'C', 'D', 'E'],
        peopleExercise: [{ name: 'X', values: 'Y' }, { name: '' }, {}],
      }),
      45
    )
    assert.equal(
      getExerciseProgress(T.VALUES, {
        selectedValues: Array.from({ length: 12 }, (_, i) => `V${i}`),
        peopleExercise: Array.from({ length: 4 }, () => ({ name: 'N', values: ['v'] })),
      }),
      100
    )
  })

  test('courbe de vie : 60 % pour 5 points, 40 % pour la réflexion', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.LIFE_CURVE, {
        points: [{}, {}],
        reflection: { form: 'up', mostlySatisfied: true, amplitude: '  ', explanation: 0 },
      }),
      // 2/5 × 60 + 3/6 × 40 (un booléen vrai et un nombre comptent, une chaîne blanche non)
      44
    )
    assert.equal(
      getExerciseProgress(T.LIFE_CURVE, { points: [], reflection: { mostlySatisfied: false } }),
      0
    )
  })

  test('personnalité : part des 5 traits renseignés numériquement', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.PERSONALITY, { openness: 3, extraversion: 0, neuroticism: 5, x: 1 }),
      60
    )
  })

  test('ciblage : nom, type et commentaire de chaque cible', ({ assert }) => {
    assert.equal(getExerciseProgress(T.TARGETING, { targets: [] }), 0)
    assert.equal(
      getExerciseProgress(T.TARGETING, { targets: [{ name: 'ACME', type: 'PME', comment: '' }] }),
      67
    )
  })

  test('DISC : sélections complètes sur 15, ou scores déjà calculés', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.DISC, {
        selections: {
          1: { most: 'D', least: 'S' },
          2: { most: 'I', least: 'C' },
          3: { most: 'S', least: 'D' },
          4: { most: 'C' },
        },
      }),
      20
    )
    assert.equal(getExerciseProgress(T.DISC, { D: 1, I: 2, S: 3, C: 4 }), 100)
    assert.equal(getExerciseProgress(T.DISC, { D: 1, I: 2 }), 0)
  })

  test('cartographie : 30 % pour le récit, 70 % pour les lignes', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.SKILL_MAPPING, {
        narrative: 'Mon parcours',
        rows: [{ mission: 'M', activity: 'A', proof: '' }],
      }),
      77
    )
    // `mapping` est accepté à la place de `rows`.
    assert.equal(
      getExerciseProgress(T.SKILL_MAPPING, {
        mapping: [{ mission: 'M', activity: 'A', proof: 'P' }],
      }),
      70
    )
    assert.equal(getExerciseProgress(T.SKILL_MAPPING, {}), 0)
  })

  test('cercle de contrôle : éléments classés sur 20', ({ assert }) => {
    assert.equal(
      getExerciseProgress(T.CIRCLE_OF_CONTROL, { inControl: [1, 2, 3], outControl: [4, 5] }),
      25
    )
    assert.equal(getExerciseProgress(T.CIRCLE_OF_CONTROL, { inControl: [1] }), 5)
    assert.equal(
      getExerciseProgress(T.CIRCLE_OF_CONTROL, {
        decisions: { a: 'inside', b: 'outside', c: 'unsure' },
      }),
      10
    )
  })

  test('autre type : 100 % dès que des données existent, sinon 0', ({ assert }) => {
    assert.equal(getExerciseProgress(T.CV_ANALYSIS, { text: 'CV' }), 100)
    assert.equal(getExerciseProgress(T.CV_ANALYSIS, {}), 0)
    assert.equal(getExerciseProgress(T.CV_ANALYSIS, null), 0)
  })

  test('le type est insensible à la casse', ({ assert }) => {
    assert.equal(getExerciseProgress('PERSONALITY', { openness: 1 }), 20)
  })
})

test.group('getExerciseProgressByType', () => {
  const iso = (value: string) => ({ toISO: () => value })

  test('renvoie 0 pour chaque exercice sans résultat', ({ assert }) => {
    const map = getExerciseProgressByType([])
    assert.sameMembers(
      Object.keys(map),
      EXERCISE_LIST.map((e) => e.slug)
    )
    assert.isTrue(Object.values(map).every((v) => v === 0))
  })

  test('retient le résultat le plus récent par type et borne le pourcentage', ({ assert }) => {
    const map = getExerciseProgressByType([
      { type: 'DISC', progressPercent: 20, date: iso('2026-01-01') },
      { type: 'disc', progressPercent: 150, date: iso('2026-02-01') },
      { type: 'values', progressPercent: 40, date: null, updatedAt: iso('2026-01-01') },
      { type: 'values', progressPercent: 90, updatedAt: iso('2025-01-01') },
      { type: 'targeting', progressPercent: null, date: iso('2026-01-01') },
    ])

    assert.equal(map[T.DISC], 100)
    assert.equal(map[T.VALUES], 40)
    assert.equal(map[T.TARGETING], 0)
  })

  test('lit progressPercent sur des instances Lucid chargées depuis la base', ({ assert }) => {
    // Non-régression : `{ ...result }` sur une instance Lucid hydratée perd les
    // colonnes (lues dans `$attributes` via le proxy) et la carte retombait à 0.
    // `$createFromAdapterResult` hydrate le modèle comme le fait une requête.
    const older = ExerciseResult.$createFromAdapterResult({
      type: T.DISC,
      progress_percent: 10,
      date: new Date('2026-01-01T00:00:00Z'),
    })!
    const latest = ExerciseResult.$createFromAdapterResult({
      type: T.DISC,
      progress_percent: 60,
      date: new Date('2026-02-01T00:00:00Z'),
    })!

    const map = getExerciseProgressByType([older, latest])

    assert.equal(map[T.DISC], 60)
  })
})
