import { EmployeeFactory } from '#database/factories/employee_factory'
import type User from '#models/user'
import env from '#start/env'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import {
  createAdmin,
  createAdvisor,
  createOrganization,
  createSuperAdmin,
} from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Régression #64 : les liens envoyés par e-mail étaient construits avec
 * `${request.protocol()}://${request.hostname()}`. Avec `trustProxy`, un en-tête
 * `Host` / `X-Forwarded-Host` forgé faisait partir chez un vrai utilisateur un
 * lien d'onboarding vers un domaine piégé. La base vient désormais d'`APP_URL`.
 *
 * Seul `X-Forwarded-Host` est forgé : en test, le serveur Vite refuse un `Host`
 * inconnu (absent en production, où `trustProxy` lit cet en-tête).
 */
const EVIL = 'evil.test'

type Scenario = {
  name: string
  send: (user: User) => { url: string; body: Record<string, unknown> }
  actor: () => Promise<User>
}

const scenarios: Scenario[] = [
  {
    name: 'création d’un candidat par son conseiller',
    actor: () => createAdvisor(),
    send: () => ({
      url: '/dashboard/conseiller/employees',
      body: { name: 'Alice Martin', email: 'alice@example.com', currentRole: 'Comptable' },
    }),
  },
  {
    name: 'invitation d’un collaborateur par l’admin du cabinet',
    actor: () => createAdmin(),
    send: () => ({
      url: '/dashboard/conseiller/settings/organization/advisors',
      body: { name: 'Nina', email: 'nina@example.com', role: 'admin' },
    }),
  },
  {
    name: 'création d’une organisation par le super admin',
    actor: () => createSuperAdmin(),
    send: () => ({
      url: '/dashboard/super-admin/organizations',
      body: { name: 'Cabinet Nord', ownerName: 'Olivia', ownerEmail: 'olivia@example.com' },
    }),
  },
]

test.group('Liens des e-mails : base APP_URL, jamais l’en-tête Host', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  for (const scenario of scenarios) {
    test(scenario.name, async ({ client, assert }) => {
      const actor = await scenario.actor()
      const { url, body } = scenario.send(actor)

      const response = await client
        .post(url)
        .json(body)
        .header('X-Forwarded-Host', EVIL)
        .header('X-Forwarded-Proto', 'https')
        .loginAs(actor)
        .withInertia()
        .redirects(0)

      response.assertStatus(302)
      assert.lengthOf(mails.sent, 1)
      const text = mails.sent[0].text ?? ''
      assert.notInclude(text, EVIL)
      assert.include(text, `${env.get('APP_URL')}/onboarding/`)
    })
  }

  test('renvoi du lien d’onboarding d’un candidat', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const employee = await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      userId: null,
      onboarded: false,
      email: 'sans-compte@example.com',
    }).create()

    const response = await client
      .post(`/dashboard/conseiller/employees/${employee.id}/onboarding/resend`)
      .header('X-Forwarded-Host', EVIL)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.lengthOf(mails.sent, 1)
    assert.notInclude(mails.sent[0].text ?? '', EVIL)
    assert.include(mails.sent[0].text ?? '', `${env.get('APP_URL')}/onboarding/`)
  })

  test('création d’un utilisateur par le super admin', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()

    const response = await client
      .post('/dashboard/super-admin/users')
      .json({ organizationId: org.id, name: 'Paul', email: 'paul@example.com', role: 'advisor' })
      .header('X-Forwarded-Host', EVIL)
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    assert.lengthOf(mails.sent, 1)
    assert.notInclude(mails.sent[0].text ?? '', EVIL)
    assert.include(mails.sent[0].text ?? '', `${env.get('APP_URL')}/onboarding/`)
  })
})
