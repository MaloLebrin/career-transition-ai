import CandidateDataController from '#controllers/candidate_data_controller'
import { ErasureAlreadyRequestedError } from '#exceptions/candidate_data_errors'
import type User from '#models/user'
import { test } from '@japa/runner'
import { Readable } from 'node:stream'

/**
 * Unit — `CandidateDataController` (#70). Contrôleur fin : le service est
 * factice, on vérifie la réponse (en-têtes du ZIP, flash + redirect back).
 */
const user = { id: 7, organizationId: 3 } as User

function makeContext() {
  const headers: Record<string, string> = {}
  const flashes: Array<[string, string]> = []
  const state = { streamed: null as Readable | null, redirectedBack: false }
  const ctx = {
    auth: { user },
    session: {
      flash(key: string, value: string) {
        flashes.push([key, value])
      },
    },
    response: {
      header(name: string, value: string) {
        headers[name] = value
      },
      stream(stream: Readable) {
        state.streamed = stream
      },
      redirect() {
        return {
          back() {
            state.redirectedBack = true
          },
        }
      },
    },
  } as any
  return { ctx, headers, flashes, state }
}

test.group('CandidateDataController', () => {
  test('export relaie l’archive du candidat connecté en pièce jointe', async ({ assert }) => {
    const stream = Readable.from(['PK'])
    const calls: User[] = []
    const controller = new CandidateDataController({
      async export(current: User) {
        calls.push(current)
        return { stream, fileName: 'Dossier_Camille.zip' }
      },
    } as any)
    const { ctx, headers, state } = makeContext()

    await controller.export(ctx)

    assert.deepEqual(calls, [user])
    assert.strictEqual(state.streamed, stream)
    assert.equal(headers['Content-Type'], 'application/zip')
    assert.equal(headers['Content-Disposition'], 'attachment; filename="Dossier_Camille.zip"')
    assert.equal(headers['Cache-Control'], 'no-store')
  })

  test('requestErasure enregistre la demande puis flash + redirect back', async ({ assert }) => {
    const calls: User[] = []
    const controller = new CandidateDataController({
      async requestErasure(current: User) {
        calls.push(current)
      },
    } as any)
    const { ctx, flashes, state } = makeContext()

    await controller.requestErasure(ctx)

    assert.deepEqual(calls, [user])
    assert.lengthOf(flashes, 1)
    assert.equal(flashes[0][0], 'success')
    assert.isTrue(state.redirectedBack)
  })

  test('requestErasure laisse remonter l’erreur métier (rendue par le handler)', async ({
    assert,
  }) => {
    const controller = new CandidateDataController({
      async requestErasure() {
        throw new ErasureAlreadyRequestedError()
      },
    } as any)
    const { ctx, flashes } = makeContext()

    await assert.rejects(() => controller.requestErasure(ctx), ErasureAlreadyRequestedError)
    assert.lengthOf(flashes, 0)
  })
})
