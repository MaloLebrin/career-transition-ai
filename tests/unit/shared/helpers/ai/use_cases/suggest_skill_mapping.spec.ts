import { test } from '@japa/runner'
import { suggestSkillMapping } from '#shared/helpers/ai/use_cases/suggest_skill_mapping'
import { makeFakeAiClient } from './fake_ai_client.js'

test.group('suggestSkillMapping', () => {
  test('normalise les missions et filtre les activités non textuelles', async ({ assert }) => {
    const { client, calls } = makeFakeAiClient({
      json: [
        { mission: 'Piloter les projets', activities: ['Planifier', 12, 'Suivre le budget'] },
        { mission: 'Manager', activities: ['Recruter'] },
      ],
    })

    const result = await suggestSkillMapping(client, 'Chef de projet')

    assert.deepEqual(result, [
      { mission: 'Piloter les projets', activities: ['Planifier', 'Suivre le budget'] },
      { mission: 'Manager', activities: ['Recruter'] },
    ])
    assert.include(calls[0].prompt, '"Chef de projet"')
    assert.deepEqual(calls[0].options, { temperature: 0.4 })
  })

  test('écarte les lignes sans mission ou sans activité', async ({ assert }) => {
    const { client } = makeFakeAiClient({
      json: [
        { mission: '', activities: ['A'] },
        { mission: 'Sans activité', activities: [] },
        { mission: 'Activités invalides', activities: 'A, B' },
        null,
        { mission: 'Valide', activities: ['B'] },
      ],
    })

    assert.deepEqual(await suggestSkillMapping(client, 'x'), [
      { mission: 'Valide', activities: ['B'] },
    ])
  })

  test("renvoie une liste vide si la réponse n'est pas un tableau", async ({ assert }) => {
    for (const json of [null, { mapping: [] }]) {
      const { client } = makeFakeAiClient({ json })
      assert.deepEqual(await suggestSkillMapping(client, 'x'), [])
    }
  })

  test('renvoie une liste vide quand le client échoue', async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('boom') })
    assert.deepEqual(await suggestSkillMapping(client, 'x'), [])
  })
})
