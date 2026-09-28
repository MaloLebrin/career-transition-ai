import { describe, expect, test } from 'vitest'
import {
  EXERCICE_RESULTS_TYPES,
  EXERCISE_LIST,
  exerciceResultStatusValues,
  exerciceResultStatusValuesValues,
  exerciceResultTypesValues,
} from '#shared/constants/exercises'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/exercises', () => {
  test('types d’exercice : enum cohérent et figé (CHECK exercise_results.type)', () => {
    expectConsistentEnum(EXERCICE_RESULTS_TYPES, exerciceResultTypesValues, [
      'motivation',
      'values',
      'personality',
      'competencies',
      'life_curve',
      'cv_analysis',
      'targeting',
      'disc',
      'circle_of_control',
      'skill_mapping',
    ])
  })

  test('statuts de résultat : enum cohérent et figé (CHECK exercise_results.status)', () => {
    expectConsistentEnum(exerciceResultStatusValues, exerciceResultStatusValuesValues, [
      'draft',
      'completed',
    ])
  })

  describe('EXERCISE_LIST (page liste)', () => {
    test('chaque entrée pointe vers un type d’exercice existant, sans doublon', () => {
      const slugs = EXERCISE_LIST.map((entry) => entry.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
      for (const slug of slugs) {
        expect(exerciceResultTypesValues).toContain(slug)
      }
    })

    test('chaque entrée a un titre et une description, titres distincts', () => {
      const titles = EXERCISE_LIST.map((entry) => entry.title)
      expect(new Set(titles).size).toBe(titles.length)
      for (const entry of EXERCISE_LIST) {
        expect(entry.title.trim(), entry.slug).not.toBe('')
        expect(entry.description.trim().length, entry.slug).toBeGreaterThan(10)
      }
    })

    test('ordre d’affichage : motivations et valeurs en premier', () => {
      expect(EXERCISE_LIST.slice(0, 2).map((entry) => entry.slug)).toEqual([
        EXERCICE_RESULTS_TYPES.MOTIVATION,
        EXERCICE_RESULTS_TYPES.VALUES,
      ])
    })

    test('compétences et analyse CV ne sont pas (encore) proposés dans la liste', () => {
      // Types stockés (analyses qualitatives) sans écran dédié dans la liste :
      // les ajouter ici est un choix produit, ce test le rend explicite.
      const slugs = EXERCISE_LIST.map((entry) => entry.slug)
      expect(slugs).not.toContain(EXERCICE_RESULTS_TYPES.COMPETENCIES)
      expect(slugs).not.toContain(EXERCICE_RESULTS_TYPES.CV_ANALYSIS)
      expect(slugs).toHaveLength(exerciceResultTypesValues.length - 2)
    })
  })
})
