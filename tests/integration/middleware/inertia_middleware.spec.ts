import { test } from '@japa/runner'
import config from '@adonisjs/core/services/config'
import InertiaMiddleware from '#middleware/inertia_middleware'
import type { HttpContext } from '@adonisjs/core/http'
import { EmployeeFactory } from '#database/factories/employee_factory'
import { NotificationFactory } from '#database/factories/notification_factory'
import { NOTIFICATION_STATUSES } from '#shared/constants/notifications'
import {
  createAdmin,
  createAdvisor,
  createCandidate,
  createEmployeeFor,
  createOrganization,
  createSuperAdmin,
} from '#tests/support/actors'

/**
 * `share()` construit les props partagées de toutes les pages Inertia. Le
 * contexte est un littéral : `inertia.always()` est remplacé par l'identité pour
 * lire directement les valeurs partagées.
 */
function makeShareCtx(
  options: {
    user?: unknown
    flash?: Record<string, unknown>
    csrfToken?: string
    withSession?: boolean
  } = {}
) {
  const flash = options.flash ?? {}
  const session =
    options.withSession === false
      ? undefined
      : {
          flashMessages: {
            get: (key: string, fallback?: unknown) => flash[key] ?? fallback,
          },
        }
  return {
    auth: options.user === undefined ? undefined : { user: options.user },
    session,
    request: { csrfToken: options.csrfToken, header: () => undefined },
    inertia: { always: (value: unknown) => value },
  } as never as HttpContext
}

async function share(ctx: HttpContext) {
  return (await new InertiaMiddleware().share(ctx)) as Record<string, any>
}

test.group('InertiaMiddleware.share', () => {
  test('invité : props vides, flash et erreurs relus depuis la session', async ({ assert }) => {
    const props = await share(
      makeShareCtx({
        flash: {
          error: 'Oups',
          success: 'Bravo',
          inputErrorsBag: { email: ['Email requis', 'Email invalide'] },
        },
        csrfToken: 'tok',
      })
    )

    assert.isUndefined(props.user)
    assert.deepEqual(props.employees, [])
    assert.deepEqual(props.notifications, [])
    assert.equal(props.unreadNotificationsCount, 0)
    assert.equal(props.csrfToken, 'tok')
    assert.deepEqual(props.flash, { error: 'Oups', success: 'Bravo' })
    // Seul le premier message de chaque champ est exposé aux formulaires.
    assert.deepEqual(props.errors, { email: 'Email requis' })
  })

  test('registrationEnabled reflète config/registration.ts', async ({ assert, cleanup }) => {
    const previous = config.get<boolean>('registration.enabled')
    cleanup(() => config.set('registration.enabled', previous))

    config.set('registration.enabled', true)
    const open = await share(makeShareCtx())
    assert.isTrue(open.registrationEnabled)

    config.set('registration.enabled', false)
    const closed = await share(makeShareCtx())
    assert.isFalse(closed.registrationEnabled)
  })

  test('sans session : flash vide et aucune erreur', async ({ assert }) => {
    const props = await share(makeShareCtx({ withSession: false }))

    assert.deepEqual(props.flash, { error: undefined, success: undefined })
    assert.deepEqual(props.errors, {})
  })

  test("conseiller : expose l'utilisateur, ses seuls candidats triés et ses notifications", async ({
    assert,
  }) => {
    const org = await createOrganization()
    const advisor = await createAdvisor(org)
    const otherAdvisor = await createAdvisor(org)
    const zoe = await createEmployeeFor(advisor)
    zoe.name = 'Zoé'
    await zoe.save()
    const alice = await createEmployeeFor(advisor)
    alice.name = 'Alice'
    await alice.save()
    await createEmployeeFor(otherAdvisor)

    await NotificationFactory.merge([
      { userId: advisor.id, status: NOTIFICATION_STATUSES.UNREAD, readAt: null },
      { userId: advisor.id, status: NOTIFICATION_STATUSES.UNREAD, readAt: null },
      { userId: advisor.id, status: NOTIFICATION_STATUSES.READ },
    ]).createMany(3)
    await NotificationFactory.merge({ userId: otherAdvisor.id }).create()

    const props = await share(makeShareCtx({ user: advisor }))

    assert.deepEqual(props.user, {
      id: advisor.id,
      organizationId: org.id,
      email: advisor.email,
      name: advisor.name,
      role: 'advisor',
    })
    assert.deepEqual(
      props.employees.map((e: { name: string }) => e.name),
      ['Alice', 'Zoé']
    )
    assert.lengthOf(props.notifications, 3)
    assert.equal(props.unreadNotificationsCount, 2)
  })

  test("admin : expose tous les candidats de l'organisation", async ({ assert }) => {
    const org = await createOrganization()
    const admin = await createAdmin(org)
    const advisor = await createAdvisor(org)
    await createEmployeeFor(advisor)
    await EmployeeFactory.merge({ organizationId: org.id, advisorId: null }).create()
    const otherOrgAdvisor = await createAdvisor()
    await createEmployeeFor(otherOrgAdvisor)

    const props = await share(makeShareCtx({ user: admin }))

    assert.lengthOf(props.employees, 2)
    assert.isTrue(
      props.employees.every((e: { organizationId: number }) => e.organizationId === org.id)
    )
  })

  test('super admin : expose les candidats de son organisation et ses notifications', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const superAdmin = await createSuperAdmin(org)
    await EmployeeFactory.merge({ organizationId: org.id }).create()
    await NotificationFactory.merge({
      userId: superAdmin.id,
      status: NOTIFICATION_STATUSES.UNREAD,
      readAt: null,
    }).create()

    const props = await share(makeShareCtx({ user: superAdmin }))

    assert.lengthOf(props.employees, 1)
    assert.lengthOf(props.notifications, 1)
    assert.equal(props.unreadNotificationsCount, 1)
  })

  test('candidat : pas de candidats, mais ses notifications (#70)', async ({ assert }) => {
    const { user } = await createCandidate()
    const other = await createCandidate()
    await NotificationFactory.merge({
      userId: user.id,
      status: NOTIFICATION_STATUSES.UNREAD,
      readAt: null,
    }).create()
    await NotificationFactory.merge({ userId: other.user.id }).create()

    const props = await share(makeShareCtx({ user }))

    assert.equal(props.user.role, 'employee')
    assert.deepEqual(props.employees, [])
    assert.lengthOf(props.notifications, 1)
    assert.equal(props.unreadNotificationsCount, 1)
  })
})

test.group('InertiaMiddleware.handle', () => {
  test('initialise, exécute la suite puis libère, en renvoyant la sortie de next()', async ({
    assert,
  }) => {
    const middleware = new InertiaMiddleware()
    const steps: string[] = []
    middleware.init = async () => {
      steps.push('init')
    }
    middleware.dispose = () => {
      steps.push('dispose')
    }

    const output = await middleware.handle({} as never, async () => {
      steps.push('next')
      return 'réponse'
    })

    assert.equal(output, 'réponse')
    assert.deepEqual(steps, ['init', 'next', 'dispose'])
  })
})
