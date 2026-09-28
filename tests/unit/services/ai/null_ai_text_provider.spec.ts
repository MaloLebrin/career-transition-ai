import type { AiTextCompletionProvider } from '#services/ai/ai_text_completion_provider'
import { NullAiTextProvider } from '#services/ai/null_ai_text_provider'
import { test } from '@japa/runner'

test.group('NullAiTextProvider', () => {
  test('renvoie un message stable expliquant l’absence de fournisseur', async ({ assert }) => {
    const provider: AiTextCompletionProvider = new NullAiTextProvider()

    const text = await provider.completeText('Analyse ce profil')

    assert.equal(
      text,
      'Analyse indisponible : aucun fournisseur IA configuré (voir AI_PROVIDER et les clés API).'
    )
  })

  test('la réponse ne dépend pas du prompt (et ne le recopie pas)', async ({ assert }) => {
    const provider = new NullAiTextProvider()

    const a = await provider.completeText('Prompt contenant jeanne@example.com')
    const b = await provider.completeText('')

    assert.equal(a, b)
    assert.notInclude(a, 'jeanne@example.com')
  })

  test("n'effectue aucun appel réseau", async ({ assert, cleanup }) => {
    const originalFetch = globalThis.fetch
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      throw new Error('network forbidden')
    }) as typeof fetch
    cleanup(() => {
      globalThis.fetch = originalFetch
    })

    await new NullAiTextProvider().completeText('x')

    assert.equal(calls, 0)
  })
})
