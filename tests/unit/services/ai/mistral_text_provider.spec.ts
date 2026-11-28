import { MistralTextProvider } from '#services/ai/mistral_text_provider'
import { overrideEnv } from '#tests/utils/env'
import { test } from '@japa/runner'

/**
 * `MistralTextProvider` (#171) : `fetch` global simulé, aucun appel réseau.
 * Le SDK Mistral lit `fetch` à chaque requête ; il ne réessaie pas lui-même
 * (stratégie `none`) : les essais sont ceux du job.
 */
type FakeResponse = { status: number; body: unknown }

function stubFetch(response: FakeResponse) {
  const original = globalThis.fetch
  const requests: Request[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(input instanceof Request ? input : new Request(input, init))
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
  return { requests, restore: () => (globalThis.fetch = original) }
}

function completion(content: unknown) {
  return {
    id: 'cmpl-1',
    object: 'chat.completion',
    model: 'mistral-small-latest',
    created: 1,
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
  }
}

test.group('MistralTextProvider', (group) => {
  group.each.setup(() => overrideEnv({ MISTRAL_API_KEY: 'test-key', MISTRAL_MODEL: undefined }))

  test('renvoie le texte de la réponse, sans espaces autour', async ({ assert, cleanup }) => {
    const fake = stubFetch({ status: 200, body: completion('  Analyse prête.  ') })
    cleanup(fake.restore)

    const text = await new MistralTextProvider().completeText('Analyse ce profil')

    assert.equal(text, 'Analyse prête.')
    assert.lengthOf(fake.requests, 1)
    const body = await fake.requests[0].json()
    assert.equal(body.model, 'mistral-small-latest')
    assert.deepEqual(body.messages, [{ role: 'user', content: 'Analyse ce profil' }])
    assert.equal(fake.requests[0].headers.get('authorization'), 'Bearer test-key')
  })

  test('utilise MISTRAL_MODEL quand il est défini', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MISTRAL_MODEL: 'mistral-large-latest' }))
    const fake = stubFetch({ status: 200, body: completion('Ok') })
    cleanup(fake.restore)

    await new MistralTextProvider().completeText('x')

    const body = await fake.requests[0].json()
    assert.equal(body.model, 'mistral-large-latest')
  })

  test('sans clé : erreur avant tout appel réseau', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MISTRAL_API_KEY: undefined }))
    const fake = stubFetch({ status: 200, body: completion('Ok') })
    cleanup(fake.restore)

    await assert.rejects(
      () => new MistralTextProvider().completeText('x'),
      'MISTRAL_API_KEY manquante'
    )
    assert.lengthOf(fake.requests, 0)
  })

  test('erreur HTTP du fournisseur (503, 401) → l’erreur remonte', async ({ assert, cleanup }) => {
    const unavailable = stubFetch({ status: 503, body: { message: 'Service unavailable' } })
    cleanup(unavailable.restore)
    await assert.rejects(() => new MistralTextProvider().completeText('x'))
    unavailable.restore()

    const unauthorized = stubFetch({ status: 401, body: { message: 'Unauthorized' } })
    cleanup(unauthorized.restore)
    await assert.rejects(() => new MistralTextProvider().completeText('x'))
    assert.lengthOf(unauthorized.requests, 1)
  })

  test('réponse vide, blanche ou sans choix → « Réponse Mistral vide »', async ({
    assert,
    cleanup,
  }) => {
    const bodies = [completion(''), completion('   '), { ...completion('x'), choices: [] }]
    for (const body of bodies) {
      const fake = stubFetch({ status: 200, body })
      cleanup(fake.restore)
      await assert.rejects(
        () => new MistralTextProvider().completeText('x'),
        'Réponse Mistral vide'
      )
      fake.restore()
    }
  })

  test('contenu non textuel (morceaux) → « Réponse Mistral vide »', async ({ assert, cleanup }) => {
    const fake = stubFetch({
      status: 200,
      body: completion([{ type: 'text', text: 'morceau' }]),
    })
    cleanup(fake.restore)

    await assert.rejects(() => new MistralTextProvider().completeText('x'), 'Réponse Mistral vide')
  })
})
