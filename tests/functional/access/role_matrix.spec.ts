import type User from '#models/user'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { createCandidate, createUser } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Matrice de contrôle d'accès : pour une route GET représentative de chaque
 * espace protégé, anonyme → /auth/login, mauvais rôle → 403, bon rôle → 200 et
 * composant épinglé (superagent suit les redirections : sans l'épinglage, une
 * redirection vers le login passerait pour un 200 valide).
 */
interface Area {
  name: string
  url: string
  component: string
  allowed: UserRole[]
  denied: UserRole[]
  forbiddenMessage: string
}

const AREAS: Area[] = [
  {
    name: 'candidat',
    url: '/dashboard/candidat',
    component: 'dashboard/employee/home/Home',
    allowed: [USERS_ROLES.EMPLOYEE],
    denied: [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT, USERS_ROLES.SUPER_ADMIN],
    forbiddenMessage: 'Accès réservé aux candidats.',
  },
  {
    name: 'conseiller',
    url: '/dashboard/conseiller',
    component: 'dashboard/conseiller/home/Home',
    allowed: [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT],
    denied: [USERS_ROLES.EMPLOYEE],
    forbiddenMessage: 'Accès réservé aux conseillers.',
  },
  {
    name: 'conseiller (paramètres)',
    url: '/dashboard/conseiller/settings',
    component: 'dashboard/conseiller/settings/Home',
    allowed: [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT],
    denied: [USERS_ROLES.EMPLOYEE],
    forbiddenMessage: 'Accès réservé aux conseillers.',
  },
  {
    name: 'super admin',
    url: '/dashboard/super-admin',
    component: 'dashboard/admin/home/Home',
    allowed: [USERS_ROLES.SUPER_ADMIN],
    denied: [USERS_ROLES.EMPLOYEE, USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT],
    forbiddenMessage: 'Accès réservé aux super administrateurs.',
  },
]

/**
 * Acteur d'un rôle donné. Un candidat reçoit sa fiche `Employee` onboardée :
 * sans elle, `checkOnboarding()` répondrait 401/redirection au lieu de laisser
 * la route parler.
 */
async function actor(role: UserRole): Promise<User> {
  if (role === USERS_ROLES.EMPLOYEE) {
    const { user } = await createCandidate()
    return user
  }
  return createUser(role)
}

for (const area of AREAS) {
  test.group(`Accès — espace ${area.name} (${area.url})`, (group) => {
    group.each.setup(() => truncateDb())

    test('anonyme : redirige vers /auth/login', async ({ client }) => {
      const response = await client.get(area.url).redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/auth/login')
    })

    test('anonyme (redirections suivies) : atterrit sur la page Login', async ({
      assert,
      client,
    }) => {
      const response = await client.get(area.url).withInertia()

      assertPage(assert, response, 'Login')
    })

    for (const role of area.denied) {
      test(`rôle ${role} : 403`, async ({ client }) => {
        const user = await actor(role)

        const response = await client.get(area.url).loginAs(user).withInertia().redirects(0)

        response.assertStatus(403)
        response.assertBodyContains({ message: area.forbiddenMessage })
      })
    }

    for (const role of area.allowed) {
      test(`rôle ${role} : 200 et ${area.component}`, async ({ assert, client }) => {
        const user = await actor(role)

        const response = await client.get(area.url).loginAs(user).withInertia().redirects(0)

        const props = assertPage(assert, response, area.component, ['user'])
        assert.equal((props.user as { id: number }).id, user.id)
      })
    }
  })
}

test.group('Accès — onboarding candidat (checkOnboarding)', (group) => {
  group.each.setup(() => truncateDb())

  const gatedUrls = [
    '/dashboard/candidat',
    '/dashboard/candidat/profile',
    '/dashboard/candidat/exercises',
    '/dashboard/candidat/synthesis',
  ]

  for (const url of gatedUrls) {
    test(`candidat non onboardé : ${url} redirige vers /dashboard/candidat/onboarding`, async ({
      client,
    }) => {
      const { user } = await createCandidate({ onboarded: false })

      const response = await client.get(url).loginAs(user).redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/dashboard/candidat/onboarding')
    })
  }

  test('candidat non onboardé : la redirection aboutit sur la page Onboarding', async ({
    assert,
    client,
  }) => {
    const { user, employee } = await createCandidate({ onboarded: false })

    const response = await client.get('/dashboard/candidat').loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/onboarding/Onboarding', [
      'employee',
    ])
    assert.equal((props.employee as { id: number }).id, employee.id)
  })

  test('candidat onboardé : /dashboard/candidat/onboarding le renvoie vers /dashboard/candidat', async ({
    client,
  }) => {
    const { user } = await createCandidate({ onboarded: true })

    const response = await client.get('/dashboard/candidat/onboarding').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/candidat')
  })

  test('compte candidat sans fiche Employee : 401', async ({ client }) => {
    const user = await createUser(USERS_ROLES.EMPLOYEE)

    const response = await client.get('/dashboard/candidat').loginAs(user).redirects(0)

    response.assertStatus(401)
  })

  test('la page d’onboarding reste réservée aux candidats', async ({ client }) => {
    const advisor = await createUser(USERS_ROLES.ADVISOR)

    const response = await client
      .get('/dashboard/candidat/onboarding')
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(403)
  })
})
