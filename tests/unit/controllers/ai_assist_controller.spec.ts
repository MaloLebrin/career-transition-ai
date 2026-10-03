import AiAssistController from '#controllers/ai_assist_controller'
import { test } from '@japa/runner'

/** Faux service : enregistre les appels et renvoie des valeurs fixes. */
function fakeService() {
  const calls: Record<string, unknown[]> = {
    extractCv: [],
    extractSkillMapping: [],
    suggestTargets: [],
    assertResultsAccess: [],
  }
  return {
    calls,
    // #101 : vérifié avant la cartographie et le ciblage, jamais avant l'import de CV.
    assertResultsAccess: async (...args: unknown[]) => {
      calls.assertResultsAccess.push(args)
    },
    extractCv: async (...args: unknown[]) => {
      calls.extractCv.push(args)
      return { name: 'Camille' }
    },
    extractSkillMapping: async (...args: unknown[]) => {
      calls.extractSkillMapping.push(args)
      return { mapping: [] }
    },
    suggestTargets: async (...args: unknown[]) => {
      calls.suggestTargets.push(args)
      return { companies: ['Acme'], sectors: [] }
    },
  }
}

/** Faux service de documents : enregistre les CV conservés. */
function fakeDocuments() {
  const stored: unknown[][] = []
  return { stored, storeImportedCv: async (...args: unknown[]) => stored.push(args) }
}

function makeCtx(payload: unknown, user: unknown = null) {
  const response = {
    body: undefined as unknown,
    ok(body: unknown) {
      this.body = body
      return this
    },
  }
  return {
    response,
    ctx: {
      request: { validateUsing: async () => payload },
      response,
      auth: {
        getUserOrFail: () => {
          if (!user) throw new Error('E_UNAUTHORIZED_ACCESS')
          return user
        },
      },
    } as any,
  }
}

test.group('AiAssistController', () => {
  test('extractCv : transmet le fichier temporaire et son type MIME, enveloppe dans data', async ({
    assert,
  }) => {
    const service = fakeService()
    const documents = fakeDocuments()
    const controller = new AiAssistController(service as any, documents as any)
    const cv = { tmpPath: '/tmp/upload-1', type: 'application', subtype: 'pdf' }
    const user = { id: 7 }
    const { ctx, response } = makeCtx({ cv }, user)

    await controller.extractCv(ctx)

    assert.deepEqual(service.calls.extractCv, [
      [{ path: '/tmp/upload-1', mimeType: 'application/pdf' }],
    ])
    assert.deepEqual(response.body, { data: { name: 'Camille' } })
    assert.deepEqual(documents.stored, [[user, cv]], 'CV conservé après extraction réussie')
  })

  test('extractCv : rien n’est conservé quand l’extraction échoue', async ({ assert }) => {
    const service = { ...fakeService(), extractCv: async () => null }
    const documents = fakeDocuments()
    const controller = new AiAssistController(service as any, documents as any)
    const { ctx, response } = makeCtx(
      { cv: { tmpPath: '/tmp/upload-2', type: 'image', subtype: 'png' } },
      { id: 7 }
    )

    await controller.extractCv(ctx)

    assert.deepEqual(response.body, { data: null })
    assert.deepEqual(documents.stored, [])
  })

  test('extractSkillMapping : identité de l’utilisateur connecté pour la pseudonymisation', async ({
    assert,
  }) => {
    const service = fakeService()
    const controller = new AiAssistController(service as any)
    const user = { name: 'Camille Martin', email: 'camille@example.com' }
    const { ctx, response } = makeCtx({ text: 'récit' }, user)

    await controller.extractSkillMapping(ctx)

    assert.deepEqual(service.calls.extractSkillMapping, [['récit', user]])
    assert.deepEqual(service.calls.assertResultsAccess, [[user]])
    assert.deepEqual(response.body, { mapping: [] })
  })

  test('suggestTargets : profil validé transmis tel quel', async ({ assert }) => {
    const service = fakeService()
    const controller = new AiAssistController(service as any)
    const profile = { skills: ['SQL'], targetRole: 'Data analyst' }
    const { ctx, response } = makeCtx(profile, { id: 7 })

    await controller.suggestTargets(ctx)

    assert.deepEqual(service.calls.suggestTargets, [[profile]])
    assert.lengthOf(service.calls.assertResultsAccess, 1)
    assert.deepEqual(response.body, { companies: ['Acme'], sectors: [] })
  })
})
