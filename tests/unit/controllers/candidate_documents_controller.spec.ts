import CandidateDocumentsController from '#controllers/candidate_documents_controller'
import { test } from '@japa/runner'
import { Readable } from 'node:stream'

/** Faux service : enregistre la fiche demandée et les appels. */
function fakeDocuments() {
  const calls: Array<[string, ...unknown[]]> = []
  const employee = { id: 42 }
  return {
    calls,
    employee,
    employeeFor: async (user: unknown, employeeId?: number) => {
      calls.push(['employeeFor', user, employeeId])
      return employee
    },
    upload: async (...args: unknown[]) => calls.push(['upload', ...args]),
    delete: async (...args: unknown[]) => calls.push(['delete', ...args]),
    download: async () => ({
      stream: Readable.from(['x']),
      contentType: 'application/pdf',
      filename: 'Été.pdf',
    }),
  }
}

function makeCtx(params: Record<string, string>, payload: unknown = null) {
  const user = { id: 1 }
  const flashes: Record<string, string> = {}
  const headers: Record<string, string> = {}
  const response = {
    redirected: false,
    streamed: null as unknown,
    header(name: string, value: string) {
      headers[name] = value
    },
    redirect() {
      return { back: () => (response.redirected = true) }
    },
    stream(body: unknown) {
      response.streamed = body
    },
  }
  return {
    user,
    flashes,
    headers,
    response,
    ctx: {
      auth: { getUserOrFail: () => user },
      params,
      request: { validateUsing: async () => payload },
      response,
      session: { flash: (key: string, value: string) => (flashes[key] = value) },
    } as any,
  }
}

test.group('CandidateDocumentsController', () => {
  test('store : fiche du candidat connecté quand la route n’a pas d’id', async ({ assert }) => {
    const documents = fakeDocuments()
    const controller = new CandidateDocumentsController(documents as any)
    const file = { clientName: 'cv.pdf' }
    const { ctx, user, flashes, response } = makeCtx({}, { document: file, kind: 'cv' })

    await controller.store(ctx)

    assert.deepEqual(documents.calls, [
      ['employeeFor', user, undefined],
      ['upload', documents.employee, user, file, 'cv'],
    ])
    assert.equal(flashes.success, 'Document ajouté.')
    assert.isTrue(response.redirected)
  })

  test('destroy : fiche désignée par :id (espace conseiller)', async ({ assert }) => {
    const documents = fakeDocuments()
    const controller = new CandidateDocumentsController(documents as any)
    const { ctx, user } = makeCtx({ id: '7', mediaId: '9' })

    await controller.destroy(ctx)

    assert.deepEqual(documents.calls, [
      ['employeeFor', user, 7],
      ['delete', documents.employee, user, 9],
    ])
  })

  test('download : flux relayé avec type et Content-Disposition UTF-8', async ({ assert }) => {
    const controller = new CandidateDocumentsController(fakeDocuments() as any)
    const { ctx, headers, response } = makeCtx({ mediaId: '3' })

    await controller.download(ctx)

    assert.equal(headers['Content-Type'], 'application/pdf')
    assert.include(headers['Content-Disposition'], "filename*=UTF-8''%C3%89t%C3%A9.pdf")
    assert.instanceOf(response.streamed, Readable)
  })
})
