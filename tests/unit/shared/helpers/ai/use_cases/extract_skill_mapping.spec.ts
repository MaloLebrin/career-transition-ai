import { test } from '@japa/runner'
import { extractSkillMappingFromText } from '#shared/helpers/ai/use_cases/extract_skill_mapping'
import { makeFakeAiClient } from './fake_ai_client.js'

test.group('extractSkillMappingFromText', () => {
  test('normalise chaque ligne et remplace les champs non textuels par ""', async ({ assert }) => {
    const { client, calls } = makeFakeAiClient({
      json: {
        mapping: [
          { mission: 'Vente', activity: 'Prospection', proof: '+30 % de CA' },
          { mission: 'Gestion', activity: 42, proof: null },
        ],
      },
    })

    const result = await extractSkillMappingFromText(client, "J'ai développé le CA.")

    assert.deepEqual(result, {
      mapping: [
        { mission: 'Vente', activity: 'Prospection', proof: '+30 % de CA' },
        { mission: 'Gestion', activity: '', proof: '' },
      ],
    })
    assert.include(calls[0].prompt, "J'ai développé le CA.")
    assert.deepEqual(calls[0].options, { temperature: 0.4 })
  })

  test('écarte les lignes entièrement vides', async ({ assert }) => {
    const { client } = makeFakeAiClient({
      json: { mapping: [{ mission: '', activity: '', proof: '' }, {}, { proof: 'Excel' }] },
    })

    assert.deepEqual(await extractSkillMappingFromText(client, 'x'), {
      mapping: [{ mission: '', activity: '', proof: 'Excel' }],
    })
  })

  test('renvoie un mapping vide pour une réponse absente ou mal formée', async ({ assert }) => {
    for (const json of [null, {}, { mapping: 'Vente' }]) {
      const { client } = makeFakeAiClient({ json })
      assert.deepEqual(await extractSkillMappingFromText(client, 'x'), { mapping: [] })
    }
  })

  test('renvoie un mapping vide quand le client échoue', async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('boom') })
    assert.deepEqual(await extractSkillMappingFromText(client, 'x'), { mapping: [] })
  })
})
