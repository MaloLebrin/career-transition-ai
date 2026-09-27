import {
  createMistralAiClient,
  createServerAiClient,
  NULL_AI_CLIENT,
  parseJsonOrNull,
  type MistralLike,
} from '#services/ai/server_ai_client'
import env from '#start/env'
import { test } from '@japa/runner'

/** Faux SDK : enregistre les requêtes, renvoie les réponses données. */
function fakeMistral(content: unknown, pages: Array<{ markdown: string }> = []) {
  const calls = { chat: [] as any[], ocr: [] as any[] }
  const client = {
    chat: {
      complete: async (request: any) => {
        calls.chat.push(request)
        return { choices: [{ message: { content } }] }
      },
    },
    ocr: {
      process: async (request: any) => {
        calls.ocr.push(request)
        return { pages }
      },
    },
  } as unknown as MistralLike
  return { client, calls }
}

function withEnv(values: Record<string, unknown>, run: () => void) {
  const original = env.get
  env.get = ((key: any, ...rest: any[]) =>
    key in values ? values[key] : (original as any).call(env, key, ...rest)) as any
  try {
    run()
  } finally {
    env.get = original
  }
}

test.group('server_ai_client | createServerAiClient', () => {
  test('client inerte avec AI_PROVIDER=none (env de test)', ({ assert }) => {
    assert.strictEqual(createServerAiClient(), NULL_AI_CLIENT)
  })

  test('client inerte en mode mistral sans MISTRAL_API_KEY', ({ assert }) => {
    withEnv({ AI_PROVIDER: 'mistral', MISTRAL_API_KEY: undefined }, () => {
      assert.strictEqual(createServerAiClient(), NULL_AI_CLIENT)
    })
  })

  test('client mistral quand le mode et la clé sont présents', ({ assert }) => {
    withEnv({ AI_PROVIDER: 'mistral', MISTRAL_API_KEY: 'server-key' }, () => {
      const client = createServerAiClient()
      assert.equal(client.provider, 'mistral')
      assert.isFunction(client.ocrToMarkdown)
    })
  })

  test('le client inerte ne renvoie rien', async ({ assert }) => {
    assert.isNull(await NULL_AI_CLIENT.completeText('x'))
    assert.isNull(await NULL_AI_CLIENT.completeJson('x'))
  })
})

test.group('server_ai_client | createMistralAiClient', () => {
  test('completeJson : modèle configuré, température, JSON parsé', async ({ assert }) => {
    const { client, calls } = fakeMistral('{"companies":["Acme"]}')
    const ai = createMistralAiClient(client, 'mistral-test')

    assert.deepEqual(await ai.completeJson('prompt', { temperature: 0.2 }), { companies: ['Acme'] })
    assert.deepInclude(calls.chat[0], { model: 'mistral-test', temperature: 0.2 })
    assert.deepEqual(calls.chat[0].messages, [{ role: 'user', content: 'prompt' }])
  })

  test('completeJson : null sur réponse non JSON ; completeText : texte brut', async ({
    assert,
  }) => {
    const ai = createMistralAiClient(fakeMistral('pas du json').client, 'm')
    assert.isNull(await ai.completeJson('p'))
    assert.equal(await ai.completeText('p'), 'pas du json')
    assert.isNull(await createMistralAiClient(fakeMistral(null).client, 'm').completeText('p'))
  })

  test('OCR : document_url pour un PDF, image_url pour une image, pages concaténées', async ({
    assert,
  }) => {
    const { client, calls } = fakeMistral('', [{ markdown: '# Page 1' }, { markdown: 'Page 2' }])
    const ai = createMistralAiClient(client, 'm')

    assert.equal(
      await ai.ocrToMarkdown!({ base64: 'QUJD', mimeType: 'application/pdf' }),
      '# Page 1\n\nPage 2'
    )
    assert.deepEqual(calls.ocr[0].document, {
      type: 'document_url',
      documentUrl: 'data:application/pdf;base64,QUJD',
    })
    assert.equal(calls.ocr[0].model, 'mistral-ocr-latest')

    await ai.ocrToMarkdown!({ base64: 'QUJD', mimeType: 'image/png' })
    assert.deepEqual(calls.ocr[1].document, {
      type: 'image_url',
      imageUrl: 'data:image/png;base64,QUJD',
    })
  })

  test('OCR : null quand aucune page', async ({ assert }) => {
    const ai = createMistralAiClient(fakeMistral('', []).client, 'm')
    assert.isNull(await ai.ocrToMarkdown!({ base64: 'QUJD', mimeType: 'image/png' }))
  })

  test('parseJsonOrNull', ({ assert }) => {
    assert.deepEqual(parseJsonOrNull(' {"a":1} '), { a: 1 })
    assert.isNull(parseJsonOrNull(''))
    assert.isNull(parseJsonOrNull(42))
  })
})
