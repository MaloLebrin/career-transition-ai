import ContactRequestsController from '#controllers/contact_requests_controller'
import type { CreateContactRequestInput } from '#shared/types/contact_request/inputs'
import { test } from '@japa/runner'

class FakeContactRequestsService {
  public created: CreateContactRequestInput[] = []

  async create(input: CreateContactRequestInput) {
    this.created.push(input)
    return { id: 1, ...input }
  }
}

function makeContext(payload: CreateContactRequestInput) {
  const flashes: Record<string, string> = {}
  let redirectedBack = false
  let createdCalled = false
  return {
    flashes,
    get redirectedBack() {
      return redirectedBack
    },
    get createdCalled() {
      return createdCalled
    },
    ctx: {
      request: { validateUsing: () => Promise.resolve(payload) },
      session: {
        flash(key: string, message: string) {
          flashes[key] = message
        },
      },
      response: {
        redirect() {
          return {
            back() {
              redirectedBack = true
            },
          }
        },
        created() {
          createdCalled = true
        },
      },
    },
  }
}

const PAYLOAD: CreateContactRequestInput = {
  name: 'Marie Dupont',
  email: 'marie@cabinet.fr',
  organization: 'Cabinet Test',
  message: 'Bonjour, je souhaite une démo de votre solution.',
  type: 'demo',
}

test.group('ContactRequestsController.store', () => {
  test('délègue la création au service avec le payload validé', async ({ assert }) => {
    const service = new FakeContactRequestsService()
    const controller = new ContactRequestsController(service as any)
    const { ctx } = makeContext(PAYLOAD)

    await controller.store(ctx as any)

    assert.deepEqual(service.created, [PAYLOAD])
  })

  /** Régression #62 : `response.created({...})` (JSON) cassait le `useForm` Inertia. */
  test('flashe un succès et redirige vers la page d’origine, sans JSON', async ({ assert }) => {
    const controller = new ContactRequestsController(new FakeContactRequestsService() as any)
    const context = makeContext(PAYLOAD)

    await controller.store(context.ctx as any)

    assert.isTrue(context.redirectedBack)
    assert.isFalse(context.createdCalled)
    assert.equal(context.flashes.success, 'Votre message a bien été envoyé.')
  })
})
