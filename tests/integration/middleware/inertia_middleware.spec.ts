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
  createB2cCandidate,
  createCandidate,
  createEmployeeFor,
  createInHouseExpert,
  createOrganization,
  createPlatformOrganization,
  createSuperAdmin,
  createUser,
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

  test('b2cRegistrationEnabled reflète registration.candidateEnabled (#93)', async ({
    assert,
    cleanup,
  }) => {
    const previous = config.get<boolean>('registration.candidateEnabled')
    cleanup(() => config.set('registration.candidateEnabled', previous))

    config.set('registration.candidateEnabled', true)
    const open = await share(makeShareCtx())
    assert.isTrue(open.b2cRegistrationEnabled)

    config.set('registration.candidateEnabled', false)
    const closed = await share(makeShareCtx())
    assert.isFalse(closed.b2cRegistrationEnabled)
    assert.isTrue(closed.registrationEnabled, 'flag conseillers indépendant')
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
      accountType: null,
      emailVerified: false,
      isPlatformTeam: false,
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

  test('admin et super admin : les particuliers B2C de la plateforme sont exclus', async ({
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const admin = await createAdmin(await createPlatformOrganization())
    const { employee: b2c } = await createB2cCandidate()
    const staffed = await EmployeeFactory.merge({
      organizationId: superAdmin.organizationId,
    }).create()

    for (const user of [superAdmin, admin]) {
      const props = await share(makeShareCtx({ user }))
      const ids = props.employees.map((e: { id: number }) => e.id)
      assert.deepEqual(ids, [staffed.id])
      assert.notInclude(ids, b2c.id)
    }
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
    assert.equal(props.user.accountType, 'b2b')
    assert.deepEqual(props.employees, [])
    assert.lengthOf(props.notifications, 1)
    assert.equal(props.unreadNotificationsCount, 1)
  })

  test('particulier B2C : accountType b2c (#92) et droits verrouillés (#94)', async ({
    assert,
  }) => {
    const { user } = await createB2cCandidate()

    const props = await share(makeShareCtx({ user }))

    assert.equal(props.user.role, 'employee')
    assert.equal(props.user.accountType, 'b2c')
    assert.deepEqual(props.employees, [])
    assert.deepEqual(props.entitlement, {
      accountType: 'b2c',
      hasPaidAccess: false,
      freeExerciseTypes: ['motivation', 'values'],
      paymentsEnabled: false,
    })
  })

  test('user.emailVerified reflète emailVerifiedAt (#98)', async ({ assert }) => {
    const unverified = await createB2cCandidate()
    const verified = await createB2cCandidate({ emailVerified: true })

    const unverifiedProps = await share(makeShareCtx({ user: unverified.user }))
    const verifiedProps = await share(makeShareCtx({ user: verified.user }))

    assert.isFalse(unverifiedProps.user.emailVerified)
    assert.isTrue(verifiedProps.user.emailVerified)
  })

  test("user.isPlatformTeam : vrai pour l'équipe plateforme, faux pour un cabinet client", async ({
    assert,
  }) => {
    const inHouse = await createInHouseExpert()
    const clientAdvisor = await createAdvisor()
    const candidate = await createB2cCandidate()
    const superAdmin = await createSuperAdmin()

    const flagFor = async (user: unknown) => {
      const props = await share(makeShareCtx({ user }))
      return Boolean(props.user.isPlatformTeam)
    }

    assert.isTrue(await flagFor(inHouse))
    assert.isFalse(await flagFor(clientAdvisor))
    assert.isFalse(await flagFor(candidate.user))
    assert.isFalse(await flagFor(superAdmin))
  })

  test('particulier B2C payé : hasPaidAccess ; candidat B2B : toujours vrai', async ({
    assert,
  }) => {
    const paid = await createB2cCandidate({ paid: true })
    const b2b = await createCandidate()

    const paidProps = await share(makeShareCtx({ user: paid.user }))
    assert.isTrue(paidProps.entitlement.hasPaidAccess)
    const b2bProps = await share(makeShareCtx({ user: b2b.user }))
    assert.equal(b2bProps.entitlement.accountType, 'b2b')
    assert.isTrue(b2bProps.entitlement.hasPaidAccess)
  })

  test('compte employee sans fiche : accountType et entitlement null', async ({ assert }) => {
    const user = await createUser('employee')

    const props = await share(makeShareCtx({ user }))

    assert.isNull(props.user.accountType)
    assert.notProperty(props, 'entitlement')
  })

  test('prop billing (#101) : prix du forfait et activation du paiement, pour tous', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()

    const props = await share(makeShareCtx({ user: advisor }))
    assert.deepEqual(props.billing, {
      paymentsEnabled: false,
      resultsPriceCents: 4900,
      currency: 'eur',
    })
    const guestProps = await share(makeShareCtx())
    assert.deepEqual(guestProps.billing, props.billing)
  })

  test('conseiller et invité : pas de prop entitlement', async ({ assert }) => {
    const advisor = await createAdvisor()

    assert.notProperty(await share(makeShareCtx({ user: advisor })), 'entitlement')
    assert.notProperty(await share(makeShareCtx()), 'entitlement')
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
