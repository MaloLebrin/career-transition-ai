import { test } from '@japa/runner'
import { analyzeExerciseResult } from '#shared/helpers/ai/use_cases/analyze_exercise'
import { makeFakeAiClient } from './fake_ai_client.js'

test.group('analyzeExerciseResult', () => {
  test("renvoie le texte de l'IA et transmet le prompt d'analyse", async ({ assert }) => {
    const { client, calls } = makeFakeAiClient({ text: 'Belle progression !' })

    const result = await analyzeExerciseResult(client, 'disc', { D: 3 })

    assert.equal(result, 'Belle progression !')
    assert.lengthOf(calls, 1)
    assert.equal(calls[0].kind, 'text')
    assert.include(calls[0].prompt, 'disc')
    assert.include(calls[0].prompt, '{"D":3}')
    assert.deepEqual(calls[0].options, { temperature: 0.8 })
  })

  test('renvoie un message par défaut quand la réponse est vide', async ({ assert }) => {
    for (const text of [null, '']) {
      const { client } = makeFakeAiClient({ text })
      assert.equal(await analyzeExerciseResult(client, 'values', {}), 'Analyse indisponible.')
    }
  })

  test("renvoie un message d'erreur quand le client échoue", async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('timeout') })
    assert.equal(
      await analyzeExerciseResult(client, 'values', {}),
      "Erreur lors de la génération de l'analyse."
    )
  })
})
