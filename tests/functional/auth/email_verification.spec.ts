import {
  EMAIL_VERIFICATION_INVALID_MESSAGE,
  EMAIL_VERIFICATION_SENT_MESSAGE,
  EMAIL_VERIFIED_MESSAGE,
} from '#controllers/email_verification_controller'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import { EMAIL_VERIFICATION_TOKEN_TTL_DAYS } from '#services/mail/email_verification_mail_service'
import env from '#start/env'
import {
  fakeMail,
  type RecordingMailProvider,
  restoreMail,
} from '#tests/functional/conseiller/helpers'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createPlatformOrganization,
} from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Vérification de l'adresse e-mail des particuliers (#98) : lien envoyé à
 * l'inscription, `GET /auth/verify-email/:token` (invité ou connecté) et
 * renvoi depuis l'espace candidat. Le parcours gratuit n'est jamais bloqué.
 */
const VERIFY = (secret: string) => `/auth/verify-email/${secret}`
const RESEND = '/dashboard/candidat/email-verification/resend'
const HOME = '/dashboard/candidat'

async function tokenFor(user: User, state: 'valid' | 'expired' | 'used' = 'valid') {
  const token = await OnboardingToken.createForUser(user.id)
  if (state === 'expired') {
    token.expiresAt = DateTime.now().minus({ minutes: 1 })
    await token.save()
  }
  if (state === 'used') {
    token.usedAt = DateTime.now().minus({ hours: 1 })
    await token.save()
  }
  return token
}

async function verifiedAtOf(user: User) {
  const fresh = await User.findOrFail(user.id)
  return fresh.emailVerifiedAt
}

test.group('Inscription particulier → lien de vérification (functional)', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(async () => {
    const truncate = await truncateDb()
    await createPlatformOrganization()
    mails = fakeMail()
    return async () => {
      restoreMail()
      await truncate()
    }
  })

  test('POST /auth/register/candidat envoie un lien bâti sur APP_URL, dont la base ne garde que l’empreinte', async ({
    assert,
    client,
  }) => {
    await client
      .post('/auth/register/candidat')
      .withInertia()
      .header('X-Forwarded-Host', 'evil.test')
      .form({
        email: 'camille.durand@example.com',
        password: 'motdepasse-8',
        name: 'Camille Durand',
        acceptTerms: 'on',
      })
      .redirects(0)

    const user = await User.findByOrFail('email', 'camille.durand@example.com')
    assert.isNull(user.emailVerifiedAt)
    assert.deepEqual(mails.recipients(), [user.email])
    const [mail] = mails.sent
    assert.equal(mail.subject, 'Confirmez votre adresse e-mail')
    const secret = mails.emailVerificationSecret()
    const base = env.get('APP_URL').replace(/\/+$/, '')
    assert.include(mail.text!, `${base}/auth/verify-email/${secret}`)
    assert.notInclude(mail.text!, 'evil.test')
    assert.deepEqual(mail.metadata, { kind: 'email_verification', userId: user.id })

    const row = await OnboardingToken.findByOrFail('userId', user.id)
    assert.equal(row.token, OnboardingToken.hash(secret))
    assert.isNull(row.usedAt)
    const ttl = row.expiresAt.diff(DateTime.now(), 'days').days
    assert.closeTo(ttl, EMAIL_VERIFICATION_TOKEN_TTL_DAYS, 0.1)
  })
})

test.group('Vérification — GET /auth/verify-email/:token (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('invité, lien valide : vérifie l’adresse, consomme le jeton, flash succès vers /auth/login', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const token = await tokenFor(user)

    const response = await client.get(VERIFY(token.plainToken!)).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('success', EMAIL_VERIFIED_MESSAGE)
    assert.isNotNull(await verifiedAtOf(user))
    await token.refresh()
    assert.isNotNull(token.usedAt)
  })

  test('candidat connecté : même vérification, retour sur /dashboard/candidat', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const token = await tokenFor(user)

    const response = await client.get(VERIFY(token.plainToken!)).loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', HOME)
    response.assertFlashMessage('success', EMAIL_VERIFIED_MESSAGE)
    assert.isNotNull(await verifiedAtOf(user))
  })

  test('autre rôle connecté (conseiller) : le lien vérifie quand même son porteur, retour sur /dashboard', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const advisor = await createAdvisor()
    const token = await tokenFor(user)

    const response = await client.get(VERIFY(token.plainToken!)).loginAs(advisor).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard')
    assert.isNotNull(await verifiedAtOf(user))
    assert.isNull(await verifiedAtOf(advisor))
  })

  test('le lien ne vérifie qu’une fois : la seconde visite est refusée', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const token = await tokenFor(user)
    await client.get(VERIFY(token.plainToken!)).redirects(0)
    const verifiedAt = await verifiedAtOf(user)

    const response = await client.get(VERIFY(token.plainToken!)).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
    response.assertFlashMessage('error', EMAIL_VERIFICATION_INVALID_MESSAGE)
    const afterSecondVisit = await verifiedAtOf(user)
    assert.equal(afterSecondVisit?.toISO(), verifiedAt?.toISO())
  })

  test('lien expiré, déjà utilisé ou inconnu : flash erreur, adresse non vérifiée', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const expired = await tokenFor(user, 'expired')
    const used = await tokenFor(user, 'used')
    const row = await OnboardingToken.findOrFail(expired.id)

    for (const secret of [expired.plainToken!, used.plainToken!, row.token, 'inconnu']) {
      const response = await client.get(VERIFY(secret)).redirects(0)

      response.assertStatus(302)
      response.assertFlashMessage('error', EMAIL_VERIFICATION_INVALID_MESSAGE)
    }
    assert.isNull(await verifiedAtOf(user))
  })

  test('est limité comme les jetons d’onboarding : 10 essais par minute et par IP', async ({
    client,
  }) => {
    for (let i = 0; i < 10; i++) {
      await client.get(VERIFY('inconnu')).header('X-Forwarded-For', '203.0.113.98').redirects(0)
    }

    const response = await client
      .get(VERIFY('inconnu'))
      .header('X-Forwarded-For', '203.0.113.98')
      .redirects(0)

    response.assertStatus(429)
  })
})

test.group('Renvoi — POST /dashboard/candidat/email-verification/resend (functional)', (group) => {
  let mails: RecordingMailProvider

  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    mails = fakeMail()
    return () => restoreMail()
  })

  test('particulier non vérifié : envoie un nouveau lien, invalide le précédent, flash succès et retour arrière', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate()
    const previous = await tokenFor(user)

    const response = await client
      .post(RESEND)
      .header('Referer', HOME)
      .loginAs(user)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', HOME)
    response.assertFlashMessage('success', EMAIL_VERIFICATION_SENT_MESSAGE)
    assert.deepEqual(mails.recipients(), [user.email])
    const secret = mails.emailVerificationSecret()
    await previous.refresh()
    assert.isNotNull(previous.usedAt, 'un seul lien actif par compte')
    const active = await OnboardingToken.query().where('userId', user.id).whereNull('usedAt')
    assert.lengthOf(active, 1)
    assert.equal(active[0].token, OnboardingToken.hash(secret))

    // Le nouveau lien fonctionne, l'ancien non.
    await client.get(VERIFY(previous.plainToken!)).redirects(0)
    assert.isNull(await verifiedAtOf(user))
    await client.get(VERIFY(secret)).redirects(0)
    assert.isNotNull(await verifiedAtOf(user))
  })

  test('reste possible avant l’onboarding candidat', async ({ assert, client }) => {
    const { user } = await createB2cCandidate({ onboarded: false })

    const response = await client.post(RESEND).loginAs(user).withInertia().redirects(0)

    response.assertStatus(302)
    response.assertFlashMessage('success', EMAIL_VERIFICATION_SENT_MESSAGE)
    assert.lengthOf(mails.sent, 1)
  })

  test('adresse déjà vérifiée : 409 (E_EMAIL_ALREADY_VERIFIED), flash erreur en Inertia, aucun envoi', async ({
    assert,
    client,
  }) => {
    const { user } = await createB2cCandidate({ emailVerified: true })

    const json = await client
      .post(RESEND)
      .header('Accept', 'application/json')
      .loginAs(user)
      .redirects(0)
    json.assertStatus(409)
    json.assertBody({ message: 'Votre adresse e-mail est déjà vérifiée.' })

    const inertia = await client
      .post(RESEND)
      .header('Referer', HOME)
      .loginAs(user)
      .withInertia()
      .redirects(0)
    inertia.assertStatus(302)
    inertia.assertHeader('location', HOME)
    inertia.assertFlashMessage('error', 'Votre adresse e-mail est déjà vérifiée.')

    assert.lengthOf(mails.sent, 0)
  })

  test('5 renvois par quart d’heure et par compte, puis 429', async ({ assert, client }) => {
    const { user } = await createB2cCandidate()

    for (let i = 0; i < 5; i++) {
      const ok = await client.post(RESEND).loginAs(user).redirects(0)
      ok.assertStatus(302)
    }
    const response = await client.post(RESEND).loginAs(user).redirects(0)

    response.assertStatus(429)
    assert.lengthOf(mails.sent, 5)
  })

  test('réservé aux candidats : conseiller 403, invité renvoyé vers la connexion', async ({
    assert,
    client,
  }) => {
    const advisor = await createAdvisor()

    const forbidden = await client.post(RESEND).loginAs(advisor).withInertia().redirects(0)
    forbidden.assertStatus(403)

    const guest = await client.post(RESEND).withInertia().redirects(0)
    assert.notEqual(guest.status(), 200)
    assert.lengthOf(mails.sent, 0)
  })

  test('un candidat B2B non vérifié peut aussi demander le lien', async ({ assert, client }) => {
    const { user } = await createCandidate()

    const response = await client.post(RESEND).loginAs(user).withInertia().redirects(0)

    response.assertStatus(302)
    assert.deepEqual(mails.recipients(), [user.email])
  })
})
