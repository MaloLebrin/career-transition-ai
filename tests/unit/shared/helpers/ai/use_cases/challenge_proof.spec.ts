import { test } from '@japa/runner'
import { challengeProof } from '#shared/helpers/ai/use_cases/challenge_proof'
import { makeFakeAiClient } from './fake_ai_client.js'

const DEFAULT_QUESTION = "Pouvez-vous préciser l'impact ou l'outil utilisé ?"

test.group('challengeProof', () => {
  test("renvoie la question de l'IA construite à partir de l'activité et de la preuve", async ({
    assert,
  }) => {
    const { client, calls } = makeFakeAiClient({ text: 'Combien de clients ?' })

    const question = await challengeProof(client, 'Prospection', 'CRM Salesforce')

    assert.equal(question, 'Combien de clients ?')
    assert.include(calls[0].prompt, '"Prospection"')
    assert.include(calls[0].prompt, '"CRM Salesforce"')
    assert.deepEqual(calls[0].options, { temperature: 0.7 })
  })

  test('renvoie la question par défaut pour une réponse vide', async ({ assert }) => {
    const { client } = makeFakeAiClient({ text: null })
    assert.equal(await challengeProof(client, 'a', 'b'), DEFAULT_QUESTION)
  })

  test('renvoie la question par défaut quand le client échoue', async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('quota') })
    assert.equal(await challengeProof(client, 'a', 'b'), DEFAULT_QUESTION)
  })
})
