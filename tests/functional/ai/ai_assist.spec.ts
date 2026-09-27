import { createAdvisor, createCandidate } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { AI_ASSIST_ROUTES } from '#shared/constants/ai_assist'
import { test } from '@japa/runner'

/**
 * Assistance IA — `/dashboard/ai/*` (`AiAssistController`,
 * `start/routes/dashboard/ai.ts`). En test `AI_PROVIDER=none` : les endpoints
 * répondent 200 avec des résultats vides, sans appel réseau.
 */

const PDF = Buffer.from('%PDF-1.4 cv de test')

test.group('Assistance IA : accès', (group) => {
  group.each.setup(() => truncateDb())

  test('refuse un visiteur non connecté', async ({ client, assert }) => {
    for (const url of Object.values(AI_ASSIST_ROUTES)) {
      const response = await client.post(url).json({}).redirects(0)
      assert.notEqual(response.status(), 200, url)
      assert.notProperty(response.body(), 'mapping')
    }
  })

  test('ouverte au candidat comme au conseiller', async ({ client }) => {
    const { user: candidate } = await createCandidate()
    const advisor = await createAdvisor()

    for (const user of [candidate, advisor]) {
      const response = await client
        .post(AI_ASSIST_ROUTES.TARGETS)
        .loginAs(user)
        .json({ skills: ['SQL'], targetRole: 'Data analyst' })
      response.assertStatus(200)
      response.assertBody({ companies: [], sectors: [] })
    }
  })
})

test.group('Assistance IA : endpoints', (group) => {
  group.each.setup(() => truncateDb())

  test('POST cv : fichier PDF accepté, data null sans fournisseur', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client
      .post(AI_ASSIST_ROUTES.CV)
      .loginAs(user)
      .file('cv', PDF, { filename: 'cv.pdf', contentType: 'application/pdf' })

    response.assertStatus(200)
    response.assertBody({ data: null })
  })

  test('POST cv : 422 sans fichier ou avec une extension refusée', async ({ client }) => {
    const { user } = await createCandidate()

    const missing = await client
      .post(AI_ASSIST_ROUTES.CV)
      .loginAs(user)
      .header('Accept', 'application/json')
      .json({})
    missing.assertStatus(422)

    const wrongType = await client
      .post(AI_ASSIST_ROUTES.CV)
      .loginAs(user)
      .header('Accept', 'application/json')
      .file('cv', Buffer.from('MZ'), { filename: 'cv.exe' })
    wrongType.assertStatus(422)
  })

  test('POST skill-mapping : mapping vide sans fournisseur, 422 sans texte', async ({ client }) => {
    const { user } = await createCandidate()

    const ok = await client
      .post(AI_ASSIST_ROUTES.SKILL_MAPPING)
      .loginAs(user)
      .json({ text: 'J’ai piloté la clôture mensuelle.' })
    ok.assertStatus(200)
    ok.assertBody({ mapping: [] })

    const invalid = await client
      .post(AI_ASSIST_ROUTES.SKILL_MAPPING)
      .loginAs(user)
      .header('Accept', 'application/json')
      .json({ text: '' })
    invalid.assertStatus(422)
  })

  test('limite de débit : 429 au-delà de 20 appels par minute', async ({ client }) => {
    const { user } = await createCandidate()
    const call = () =>
      client
        .post(AI_ASSIST_ROUTES.TARGETS)
        .loginAs(user)
        .header('Accept', 'application/json')
        .json({ skills: [], targetRole: 'x' })

    for (let i = 0; i < 20; i++) {
      const response = await call()
      response.assertStatus(200)
    }
    const blocked = await call()
    blocked.assertStatus(429)
  })
})
