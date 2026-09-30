import Notification from '#models/notification'
import Organization from '#models/organization'
import { NotificationFactory } from '#database/factories/notification_factory'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { createAdvisor, createCandidate, createSuperAdmin } from '#tests/support/actors'
import { restoreCloudinary, swapFakeCloudinary } from '#tests/support/fake_cloudinary'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/**
 * Espace candidat (#70) :
 * - droits RGPD en libre-service : `GET /dashboard/candidat/data/export`,
 *   `POST /dashboard/candidat/data/erasure-request` ;
 * - `dataRights` et notifications dans les props du profil.
 */
const PROFILE = '/dashboard/candidat/profile'
const EXPORT = '/dashboard/candidat/data/export'
const ERASURE = '/dashboard/candidat/data/erasure-request'

test.group('Candidat — droits RGPD en libre-service', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('télécharge l’archive ZIP de ses données', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client.get(EXPORT).loginAs(user)

    response.assertStatus(200)
    response.assertHeader('content-type', 'application/zip')
    response.assertHeader('cache-control', 'no-store')
    const disposition = response.header('content-disposition')
    if (!/^attachment; filename="Dossier_.+\.zip"$/.test(disposition)) {
      throw new Error(`Content-Disposition inattendu : ${disposition}`)
    }
  })

  test('l’export est limité à 5 par heure', async ({ client }) => {
    const { user } = await createCandidate()

    for (let i = 0; i < 5; i++) {
      const allowed = await client.get(EXPORT).loginAs(user)
      allowed.assertStatus(200)
    }
    const response = await client.get(EXPORT).loginAs(user).redirects(0)

    response.assertStatus(429)
  })

  test('les routes RGPD sont réservées aux candidats', async ({ client }) => {
    const advisor = await createAdvisor()

    const download = await client.get(EXPORT).loginAs(advisor).withInertia().redirects(0)
    const erasure = await client.post(ERASURE).loginAs(advisor).withInertia().redirects(0)

    download.assertStatus(403)
    erasure.assertStatus(403)
  })

  test('demande d’effacement : date enregistrée, équipe prévenue, retour au profil', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const advisor = await createAdvisor()
    const { user, employee } = await createCandidate({ advisor })

    const response = await client
      .post(ERASURE)
      .header('referer', PROFILE)
      .loginAs(user)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.include(String(response.flashMessage('success')), 'sous un mois')
    await employee.refresh()
    assert.isNotNull(employee.erasureRequestedAt)

    const rows = await Notification.query().where('type', NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED)
    const recipients = rows.map((row) => row.userId)
    assert.sameMembers(recipients, [superAdmin.id, advisor.id])
  })

  test('une seconde demande est refusée par un message, sans renotifier', async ({
    client,
    assert,
  }) => {
    await createSuperAdmin()
    const { user, employee } = await createCandidate()
    employee.erasureRequestedAt = DateTime.now().minus({ days: 3 })
    await employee.save()

    const response = await client
      .post(ERASURE)
      .header('referer', PROFILE)
      .loginAs(user)
      .withInertia()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', PROFILE)
    assert.include(String(response.flashMessage('error')), 'déjà enregistrée')
    assert.lengthOf(
      await Notification.query().where('type', NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED),
      0
    )
  })
})

test.group('Candidat — profil et notifications (#70)', (group) => {
  group.each.setup(() => truncateDb())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('son profil expose dataRights et ses notifications', async ({ client, assert }) => {
    const { user, employee } = await createCandidate()
    employee.erasureRequestedAt = DateTime.fromISO('2026-09-01T10:00:00.000Z')
    await employee.save()
    await NotificationFactory.merge({
      userId: user.id,
      type: NOTIFICATION_TYPES.SYNTHESIS_SHARED,
      status: 'unread',
      readAt: null,
    }).create()

    const response = await client.get(PROFILE).loginAs(user).withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/profile/Home', [
      'dataRights',
      'notifications',
      'unreadNotificationsCount',
    ])
    assert.equal(
      DateTime.fromISO((props.dataRights as any).erasureRequestedAt).toMillis(),
      employee.erasureRequestedAt!.toMillis()
    )
    assert.lengthOf(props.notifications as unknown[], 1)
    assert.equal(props.unreadNotificationsCount, 1)
  })

  test('le conseiller ne reçoit pas les droits RGPD du candidat', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate({
      advisor,
      organization: await Organization.findOrFail(advisor.organizationId),
    })

    const response = await client
      .get(`/dashboard/conseiller/employees/${employee.id}/profile`)
      .loginAs(advisor)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/employee/profile/Home', ['dataRights'])
    assert.isNull(props.dataRights)
  })
})
