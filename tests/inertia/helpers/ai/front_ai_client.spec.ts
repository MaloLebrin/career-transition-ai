import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mistral = vi.hoisted(() => ({
  complete: vi.fn(),
  process: vi.fn(),
  ctor: vi.fn(),
}))

vi.mock('@mistralai/mistralai', () => ({
  Mistral: class {
    chat = { complete: mistral.complete }
    ocr = { process: mistral.process }
    constructor(options: unknown) {
      mistral.ctor(options)
    }
  },
}))

import { createFrontAiClient } from '../../../../inertia/helpers/ai/front_ai_client'

describe('createFrontAiClient', () => {
  beforeEach(() => {
    mistral.complete.mockReset()
    mistral.process.mockReset()
    mistral.ctor.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('sans fournisseur configuré : client inerte', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'none')
    const client = createFrontAiClient()
    expect(client.provider).toBe('none')
    expect(await client.completeText('x')).toBeNull()
    expect(await client.completeJson('x')).toBeNull()
    expect(mistral.ctor).not.toHaveBeenCalled()
  })

  test('mistral sans clé API : repli sur un client inerte', async () => {
    vi.stubEnv('VITE_AI_PROVIDER', ' Mistral ')
    vi.stubEnv('VITE_MISTRAL_API_KEY', '')
    vi.stubEnv('AI_API_KEY', '')
    const client = createFrontAiClient()
    expect(client.provider).toBe('none')
    expect(await client.completeText('x')).toBeNull()
    expect(await client.completeJson('x')).toBeNull()
  })

  describe('avec mistral configuré', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_AI_PROVIDER', 'mistral')
      vi.stubEnv('VITE_MISTRAL_API_KEY', 'sk-test')
    })

    test('completeText renvoie le contenu texte (température par défaut 0.7)', async () => {
      mistral.complete.mockResolvedValueOnce({ choices: [{ message: { content: 'Bonjour' } }] })
      const client = createFrontAiClient()

      expect(client.provider).toBe('mistral')
      expect(mistral.ctor).toHaveBeenCalledWith({ apiKey: 'sk-test' })
      expect(await client.completeText('Salut')).toBe('Bonjour')
      expect(mistral.complete).toHaveBeenCalledWith({
        model: 'mistral-small-latest',
        temperature: 0.7,
        messages: [{ role: 'user', content: 'Salut' }],
      })

      mistral.complete.mockResolvedValueOnce({
        choices: [{ message: { content: [{ type: 'text' }] } }],
      })
      expect(await client.completeText('Salut', { temperature: 0.1 })).toBeNull()
      expect(mistral.complete).toHaveBeenLastCalledWith(
        expect.objectContaining({ temperature: 0.1 })
      )
    })

    test('completeJson parse le JSON et renvoie null si invalide ou vide', async () => {
      const client = createFrontAiClient()

      mistral.complete.mockResolvedValueOnce({ choices: [{ message: { content: ' {"a":1} ' } }] })
      expect(await client.completeJson('p')).toEqual({ a: 1 })
      expect(mistral.complete).toHaveBeenLastCalledWith(
        expect.objectContaining({ temperature: 0.4 })
      )

      mistral.complete.mockResolvedValueOnce({ choices: [{ message: { content: 'pas du json' } }] })
      expect(await client.completeJson('p', { temperature: 0 })).toBeNull()

      mistral.complete.mockResolvedValueOnce({ choices: [{ message: { content: '   ' } }] })
      expect(await client.completeJson('p')).toBeNull()

      mistral.complete.mockResolvedValueOnce({ choices: [] })
      expect(await client.completeJson('p')).toBeNull()
    })

    test('ocrToMarkdown concatène le markdown des pages', async () => {
      const client = createFrontAiClient()

      mistral.process.mockResolvedValueOnce({
        pages: [
          { markdown: '# Page 1' },
          { markdown: '' },
          { markdown: 42 },
          { markdown: 'Page 2' },
        ],
      })
      expect(await client.ocrToMarkdown!({ base64: 'QUJD', mimeType: 'application/pdf' })).toBe(
        '# Page 1\n\nPage 2'
      )
      expect(mistral.process).toHaveBeenCalledWith({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', documentUrl: 'data:application/pdf;base64,QUJD' },
      })

      mistral.process.mockResolvedValueOnce({})
      expect(await client.ocrToMarkdown!({ base64: 'x', mimeType: 'image/png' })).toBeNull()
    })
  })
})
