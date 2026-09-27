import { AiAssistService } from '#services/ai_assist_service'
import type { AiClient } from '#shared/helpers/ai/ai_client'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TMP_DIR = app.tmpPath('tests-ai-assist')

/** Faux client : enregistre les prompts, répond `json` à `completeJson`. */
function fakeClient(json: unknown, overrides: Partial<AiClient> = {}) {
  const prompts: string[] = []
  const client: AiClient = {
    provider: 'mistral',
    completeText: async () => null,
    completeJson: async (prompt: string) => {
      prompts.push(prompt)
      return json as any
    },
    ...overrides,
  }
  return { client, prompts, service: new AiAssistService(() => client) }
}

test.group('AiAssistService', (group) => {
  group.setup(async () => {
    await mkdir(TMP_DIR, { recursive: true })
    return () => rm(TMP_DIR, { recursive: true, force: true })
  })

  test('extractCv : OCR du fichier en base64 puis extraction structurée', async ({ assert }) => {
    const path = join(TMP_DIR, 'cv.pdf')
    await writeFile(path, 'ABC')
    const ocrCalls: Array<{ base64: string; mimeType: string }> = []
    const { service, prompts } = fakeClient(
      { name: 'Camille Martin', skills: [{ name: 'SQL', level: 4 }] },
      {
        ocrToMarkdown: async (input) => {
          ocrCalls.push(input)
          return '# Camille Martin — comptable'
        },
      }
    )

    const data = await service.extractCv({ path, mimeType: 'application/pdf' })

    assert.deepEqual(ocrCalls, [{ base64: 'QUJD', mimeType: 'application/pdf' }])
    assert.include(prompts[0], '# Camille Martin — comptable')
    assert.equal(data?.name, 'Camille Martin')
    assert.deepEqual(data?.skills, [{ name: 'SQL', level: 4 }])
  })

  test('extractCv : null sans OCR (IA désactivée) ou si l’OCR ne lit rien', async ({ assert }) => {
    const path = join(TMP_DIR, 'cv.png')
    await writeFile(path, 'x')

    assert.isNull(await fakeClient({}).service.extractCv({ path, mimeType: 'image/png' }))

    const { service, prompts } = fakeClient({}, { ocrToMarkdown: async () => null })
    assert.isNull(await service.extractCv({ path, mimeType: 'image/png' }))
    assert.lengthOf(prompts, 0)
  })

  test('extractSkillMapping : nom et e-mail de l’utilisateur retirés du prompt', async ({
    assert,
  }) => {
    const { service, prompts } = fakeClient({
      mapping: [{ mission: 'Clôture', activity: 'Rapprochements', proof: 'Délai -2 j' }],
    })

    const result = await service.extractSkillMapping(
      'Je suis Camille Martin (camille@example.com), Camille a piloté la clôture.',
      { name: 'Camille Martin', email: 'camille@example.com' }
    )

    assert.lengthOf(result.mapping, 1)
    assert.notInclude(prompts[0], 'Camille')
    assert.notInclude(prompts[0], 'camille@example.com')
    assert.include(prompts[0], 'a piloté la clôture')
  })

  test('suggestTargets : délègue au cas d’usage', async ({ assert }) => {
    const { service, prompts } = fakeClient({ companies: ['Acme'], sectors: ['Industrie'] })

    const result = await service.suggestTargets({ skills: ['SQL'], targetRole: 'Data analyst' })

    assert.deepEqual(result, { companies: ['Acme'], sectors: ['Industrie'] })
    assert.include(prompts[0], 'Data analyst')
  })

  test('sans fournisseur : résultats vides', async ({ assert }) => {
    const service = new AiAssistService(() => ({
      provider: 'none',
      completeText: async () => null,
      completeJson: async () => null,
    }))
    assert.deepEqual(await service.suggestTargets({ skills: [], targetRole: 'x' }), {
      companies: [],
      sectors: [],
    })
    assert.deepEqual(await service.extractSkillMapping('texte', {}), { mapping: [] })
  })
})
