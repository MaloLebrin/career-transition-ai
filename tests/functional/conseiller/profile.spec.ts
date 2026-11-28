import {
  EMAIL_CHANGE_TAKEN_MESSAGE,
  EMAIL_CHANGED_MESSAGE,
} from '#controllers/email_verification_controller'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import { createAdvisor } from '#tests/support/actors'
import { inertiaErrors } from '#tests/support/validation'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Profil du conseiller connecté : GET (redirection vers les réglages) / PUT
 * /dashboard/conseiller/profile. Une nouvelle adresse n'est appliquée qu'après
 * le clic sur le lien envoyé à cette adresse (#143).
 */
const PROFILE = '/dashboard/conseiller/profile'
const SETTINGS = '/dashboard/conseiller/settings'
const VERIFY = (secret: string) => `/auth/verify-email/${secret}`

test.group('Conseiller — profil', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(async () => {
    const truncate = await truncateDb()
    mails = fakeMail()
    return async () => {
      restoreMail()
      await truncate()
    }
  })

  test('redirige vers les réglages, où se modifie le profil (#69)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client.get(PROFILE).loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard/conseiller/settings')
  })

  test('même adresse : met le nom à jour, aucun e-mail', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client
      .put(PROFILE)
      .json({ name: 'Claire Conseil', email: advisor.email })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', SETTINGS)
    assert.equal(response.flashMessage('success'), 'Profil mis à jour.')
    await advisor.refresh()
    assert.equal(advisor.name, 'Claire Conseil')
    assert.lengthOf(mails.sent, 0)
  })

  test('nouvelle adresse : lien envoyé à celle-ci, l’adresse ne change qu’après le clic (#143)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const previous = advisor.email

    const response = await client
      .put(PROFILE)
      .json({ name: 'Claire Conseil', email: 'claire@example.com' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', SETTINGS)
    assert.equal(
      response.flashMessage('success'),
      'Profil mis à jour. Un lien de confirmation a été envoyé à claire@example.com : votre adresse changera après votre clic.'
    )
    await advisor.refresh()
    assert.equal(advisor.name, 'Claire Conseil')
    assert.equal(advisor.email, previous)
    assert.deepEqual(mails.recipients(), ['claire@example.com'])

    // La page des réglages annonce l'adresse en attente.
    const settings = await client.get(SETTINGS).loginAs(advisor).withInertia()
    settings.assertInertiaPropsContains({ pendingEmail: 'claire@example.com' })

    const verify = await client.get(VERIFY(mails.emailVerificationSecret(0))).redirects(0)

    verify.assertStatus(302)
    verify.assertHeader('location', '/auth/login')
    assert.equal(verify.flashMessage('success'), EMAIL_CHANGED_MESSAGE)
    const fresh = await User.findOrFail(advisor.id)
    assert.equal(fresh.email, 'claire@example.com')
    assert.isNotNull(fresh.emailVerifiedAt)
    // L'ancienne adresse est prévenue du changement.
    assert.deepEqual(mails.recipients(), ['claire@example.com', previous])
    assert.include(mails.sent[1].text ?? '', 'claire@example.com')
  })

  test('le lien de changement d’e-mail ne sert pas à choisir le mot de passe (#143)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    await client
      .put(PROFILE)
      .json({ name: advisor.name, email: 'tiers@example.com' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    const secret = mails.emailVerificationSecret(0)

    const response = await client
      .post(`/onboarding/${secret}`)
      .withInertia()
      .json({ password: 'motdepasse-pirate', password_confirmation: 'motdepasse-pirate' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    const token = await OnboardingToken.findByOrFail('token', OnboardingToken.hash(secret))
    assert.isNull(token.usedAt)
  })

  test('adresse prise entre la demande et le clic : rien ne change (#143)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const previous = advisor.email
    await client
      .put(PROFILE)
      .json({ name: advisor.name, email: 'convoitee@example.com' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)
    const other = await createAdvisor()
    other.email = 'convoitee@example.com'
    await other.save()

    const verify = await client
      .get(VERIFY(mails.emailVerificationSecret(0)))
      .loginAs(advisor)
      .redirects(0)

    verify.assertHeader('location', '/dashboard')
    assert.equal(verify.flashMessage('error'), EMAIL_CHANGE_TAKEN_MESSAGE)
    const unchanged = await User.findOrFail(advisor.id)
    assert.equal(unchanged.email, previous)
  })

  test('refuse un email déjà utilisé, casse comprise (flash error, rien ne change)', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor()
    const originalEmail = advisor.email

    const response = await client
      .put(PROFILE)
      .header('referer', PROFILE)
      .json({ name: 'X', email: other.email.toUpperCase() })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', PROFILE)
    assert.equal(
      response.flashMessage('error'),
      'Cette adresse e-mail est déjà utilisée par un autre compte.'
    )
    const reloaded = await User.findOrFail(advisor.id)
    assert.equal(reloaded.email, originalEmail)
    assert.notEqual(reloaded.name, 'X')
    assert.lengthOf(mails.sent, 0)
  })

  test('rejette un nom vide et un email invalide', async ({ client, assert }) => {
    const advisor = await createAdvisor()

    const response = await client
      .put(PROFILE)
      .json({ name: '', email: 'pas-un-email' })
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    assert.sameMembers(Object.keys(inertiaErrors(response)), ['name', 'email'])
  })
})
