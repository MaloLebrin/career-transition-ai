import { test } from '@japa/runner'
import { EXERCISE_LIST, EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { getExerciseTitle } from '#shared/helpers/exercises'

test.group('getExerciseTitle', () => {
  test("renvoie le titre de l'exercice pour un slug connu", ({ assert }) => {
    const disc = EXERCISE_LIST.find((e) => e.slug === EXERCICE_RESULTS_TYPES.DISC)!
    assert.equal(getExerciseTitle(EXERCICE_RESULTS_TYPES.DISC), disc.title)
  })

  test('ignore la casse (types front en majuscules)', ({ assert }) => {
    assert.equal(getExerciseTitle('DISC'), getExerciseTitle('disc'))
  })

  test('renvoie la valeur fournie pour un type inconnu', ({ assert }) => {
    assert.equal(getExerciseTitle('SUDOKU'), 'SUDOKU')
  })
})
