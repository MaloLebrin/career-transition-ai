import { describe, expect, test } from 'vitest'
import { pseudonymizeForAi } from '#shared/helpers/ai/exercise_profile'
import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'

describe('buildAnalyzeExercisePrompt (prompt générique de repli)', () => {
  test('annonce le type d’exercice et sérialise les données en JSON', () => {
    const data = { answers: [{ q: 'Pourquoi ?', a: 'Autonomie' }], score: 7 }
    const prompt = buildAnalyzeExercisePrompt('motivation', data)
    expect(prompt).toContain('accompagnement carrière : motivation.')
    expect(prompt).toContain(`Données : ${JSON.stringify(data)}.`)
  })

  test('impose une réponse courte, bienveillante et actionnable', () => {
    const prompt = buildAnalyzeExercisePrompt('values', {})
    expect(prompt).toContain('max 4 phrases')
    expect(prompt).toContain('conseil concret')
    expect(prompt).toContain('bienveillant')
  })

  test('sérialise fidèlement les données non objet (tableau, null, texte accentué)', () => {
    expect(buildAnalyzeExercisePrompt('disc', ['D', 'C'])).toContain('Données : ["D","C"].')
    expect(buildAnalyzeExercisePrompt('disc', null)).toContain('Données : null.')
    expect(buildAnalyzeExercisePrompt('disc', 'Équilibre')).toContain('Données : "Équilibre".')
  })

  test('est déterministe et varie avec le type', () => {
    const data = { a: 1 }
    expect(buildAnalyzeExercisePrompt('values', data)).toBe(
      buildAnalyzeExercisePrompt('values', data)
    )
    expect(buildAnalyzeExercisePrompt('values', data)).not.toBe(
      buildAnalyzeExercisePrompt('disc', data)
    )
  })

  test('RGPD : n’injecte que les données reçues, déjà pseudonymisées par l’appelant', () => {
    const identity = { name: 'Marie Martin', email: 'marie.martin@example.com' }
    const data = pseudonymizeForAi(
      { note: 'Marie Martin (marie.martin@example.com) vise la data' },
      identity
    )
    const prompt = buildAnalyzeExercisePrompt('targeting', data)
    expect(prompt).not.toMatch(/marie|martin|example\.com/i)
    expect(prompt).toContain('[candidat]')
    expect(prompt).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
  })
})
