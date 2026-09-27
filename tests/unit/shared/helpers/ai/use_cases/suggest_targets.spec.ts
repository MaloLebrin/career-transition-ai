import { test } from '@japa/runner'
import { suggestTargets } from '#shared/helpers/ai/use_cases/suggest_targets'
import { makeFakeAiClient } from './fake_ai_client.js'

const profile = { skills: ['React', 'Gestion de projet'], targetRole: 'Product Owner' }

test.group('suggestTargets', () => {
  test('renvoie entreprises et secteurs en ne gardant que les chaînes', async ({ assert }) => {
    const { client, calls } = makeFakeAiClient({
      json: { companies: ['Doctolib', 42, 'Alan', null], sectors: ['Santé', { x: 1 }] },
    })

    const result = await suggestTargets(client, profile)

    assert.deepEqual(result, { companies: ['Doctolib', 'Alan'], sectors: ['Santé'] })
    assert.equal(calls[0].kind, 'json')
    assert.include(calls[0].prompt, 'React, Gestion de projet')
    assert.include(calls[0].prompt, 'Product Owner')
    assert.deepEqual(calls[0].options, { temperature: 0.4 })
  })

  test('renvoie des listes vides pour une réponse nulle ou mal formée', async ({ assert }) => {
    for (const json of [null, { companies: 'Doctolib', sectors: 3 }, []]) {
      const { client } = makeFakeAiClient({ json })
      assert.deepEqual(await suggestTargets(client, profile), { companies: [], sectors: [] })
    }
  })

  test('renvoie des listes vides quand le client échoue', async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('réseau') })
    assert.deepEqual(await suggestTargets(client, profile), { companies: [], sectors: [] })
  })
})
