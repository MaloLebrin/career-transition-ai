import { describe, expect, test } from 'vitest'
import { getExerciseProgress, getExerciseProgressByType } from '#shared/helpers/exercise_progress'

const iso = (value: string | null) => ({ toISO: () => value })

describe('getExerciseProgress', () => {
  test('un exercice terminé vaut toujours 100 %, quelle que soit la casse du statut', () => {
    expect(getExerciseProgress('values', {}, 'COMPLETED')).toBe(100)
    expect(getExerciseProgress('unknown', null, 'completed')).toBe(100)
  })

  describe('motivation', () => {
    test('compte les duels répondus dans la matrice triangulaire (231 duels)', () => {
      const matrix = Array.from({ length: 22 }, () => Array(22).fill(null))
      // 3 duels répondus au-dessus de la diagonale + 1 valeur sous la diagonale ignorée
      matrix[0][1] = 1
      matrix[0][2] = 0
      matrix[1][2] = 1
      matrix[2][0] = 1
      expect(getExerciseProgress('motivation', { matrix })).toBe(Math.round((3 / 231) * 100))
    })

    test('sans réponse dans la matrice, estime la progression depuis le duel courant', () => {
      // i=5, j=10 → 21*5 - (4*5)/2 + 5 = 100 duels
      expect(getExerciseProgress('motivation', { currentI: 5, currentJ: 10 })).toBe(43)
      expect(getExerciseProgress('motivation', { matrix: [[null, null], 'x'] })).toBe(0)
      expect(getExerciseProgress('motivation', null)).toBe(0)
    })
  })

  test('valeurs : 70 % pour le classement, 30 % pour les figures d’inspiration', () => {
    const selectedValues = Array.from({ length: 12 }, (_, i) => `v${i}`)
    expect(getExerciseProgress('values', { selectedValues })).toBe(70)
    expect(
      getExerciseProgress('values', {
        selectedValues: ['a', 'b', 'c', 'd', 'e'],
        peopleExercise: [
          { name: 'Marie', values: 'Courage' },
          { name: '  ', values: '' },
          { name: 'Jean', values: null },
          { name: 'Ignoré', values: 'Au-delà de 3' },
        ],
      })
    ).toBe(Math.round(0.5 * 70 + (3 / 6) * 30))
    expect(getExerciseProgress('values', undefined)).toBe(0)
  })

  test('courbe de vie : 60 % pour 5 points, 40 % pour les 6 questions de réflexion', () => {
    const points = Array.from({ length: 7 }, (_, i) => ({ year: 2000 + i }))
    expect(getExerciseProgress('life_curve', { points })).toBe(60)
    expect(
      getExerciseProgress('LIFE_CURVE', {
        points: points.slice(0, 2),
        reflection: { form: 'U', mostlySatisfied: '', amplitude: 'forte' },
      })
    ).toBe(Math.round((2 / 5) * 60 + (2 / 6) * 40))
    expect(getExerciseProgress('life_curve', {})).toBe(0)
  })

  test('personnalité : proportion des 5 traits renseignés en nombre', () => {
    expect(
      getExerciseProgress('personality', { openness: 5, extraversion: 0, neuroticism: '3' })
    ).toBe(40)
  })

  test('ciblage : nom, type et commentaire comptent chacun pour un tiers (10 cibles max)', () => {
    expect(getExerciseProgress('targeting', { targets: [] })).toBe(0)
    expect(
      getExerciseProgress('targeting', {
        targets: [
          { name: 'AFPA', type: 'Organisme de formation', comment: 'Proche' },
          { name: 'Acme', type: '', comment: null },
        ],
      })
    ).toBe(67)
  })

  test('DISC : sélections complètes sur 15 blocs, ou scores finaux', () => {
    expect(
      getExerciseProgress('disc', {
        selections: {
          1: { most: 'a', least: 'b' },
          2: { most: 'a', least: '' },
          3: { most: 'c', least: 'd' },
        },
      })
    ).toBe(13)
    expect(getExerciseProgress('disc', { D: 10, I: 20, S: 30, C: 40 })).toBe(100)
    expect(getExerciseProgress('disc', { D: 10, I: 20 })).toBe(0)
  })

  test('cartographie des compétences : 30 % pour le récit, 70 % pour les lignes (5 max)', () => {
    expect(getExerciseProgress('skill_mapping', { narrative: 'Mon parcours' })).toBe(30)
    expect(
      getExerciseProgress('skill_mapping', {
        rows: [{ mission: 'M', activity: 'A', proof: 'P' }, { mission: 'M2' }],
      })
    ).toBe(Math.round((4 / 6) * 70))
    expect(
      getExerciseProgress('skill_mapping', {
        mapping: [{ mission: 'M', activity: 'A', proof: 'P' }],
      })
    ).toBe(70)
  })

  test('cercle de contrôle : résultat final ou décisions du brouillon sur 20 éléments', () => {
    expect(
      getExerciseProgress('circle_of_control', { inControl: ['a', 'b'], outControl: ['c'] })
    ).toBe(15)
    expect(getExerciseProgress('circle_of_control', { outControl: Array(25).fill('x') })).toBe(100)
    expect(
      getExerciseProgress('circle_of_control', {
        decisions: { 1: 'inside', 2: 'outside', 3: 'maybe' },
      })
    ).toBe(10)
    expect(getExerciseProgress('circle_of_control', null)).toBe(0)
  })

  test('type inconnu : 100 % si des données sont présentes, 0 % sinon', () => {
    expect(getExerciseProgress('cv_analysis', { text: 'CV' })).toBe(100)
    expect(getExerciseProgress('cv_analysis', 'contenu')).toBe(100)
    expect(getExerciseProgress('cv_analysis', 12)).toBe(100)
    expect(getExerciseProgress('cv_analysis', true)).toBe(100)
    expect(getExerciseProgress('cv_analysis', false)).toBe(0)
    expect(getExerciseProgress('cv_analysis', [])).toBe(0)
    expect(getExerciseProgress('cv_analysis', {})).toBe(0)
    expect(getExerciseProgress('cv_analysis', undefined)).toBe(0)
    expect(getExerciseProgress('cv_analysis', Symbol('x'))).toBe(0)
  })
})

describe('getExerciseProgressByType', () => {
  test('retient le résultat le plus récent par type et borne les pourcentages', () => {
    const progress = getExerciseProgressByType([
      { type: 'VALUES', progressPercent: 30, date: iso('2024-01-01T00:00:00Z') },
      { type: 'values', progressPercent: 80, date: iso('2024-03-01T00:00:00Z') },
      { type: 'values', progressPercent: 10, date: iso('2024-02-01T00:00:00Z') },
      { type: 'disc', progressPercent: 140, date: null, updatedAt: iso('2024-01-01T00:00:00Z') },
      { type: 'life_curve', progressPercent: -5 },
      { type: 'motivation', progressPercent: null, date: iso('2024-01-01T00:00:00Z') },
      { type: 'targeting', progressPercent: Number.NaN },
    ])

    expect(progress.values).toBe(80)
    expect(progress.disc).toBe(100)
    expect(progress.life_curve).toBe(0)
    expect(progress.motivation).toBe(0)
    expect(progress.targeting).toBe(0)
    // Tous les exercices du catalogue sont présents
    expect(Object.keys(progress)).toEqual(
      expect.arrayContaining([
        'motivation',
        'values',
        'life_curve',
        'personality',
        'targeting',
        'disc',
        'skill_mapping',
        'circle_of_control',
      ])
    )
    expect(progress.personality).toBe(0)
  })

  test('liste vide ou absente : tout à 0', () => {
    expect(Object.values(getExerciseProgressByType([])).every((v) => v === 0)).toBe(true)
    expect(Object.values(getExerciseProgressByType(undefined as never)).every((v) => v === 0)).toBe(
      true
    )
  })
})
