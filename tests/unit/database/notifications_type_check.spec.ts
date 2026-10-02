import { notificationTypeCheckStatements } from '#database/migrations/1791000000000_resync_notifications_type_check'
import Notification from '#models/notification'
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  notificationTypeValues,
} from '#shared/constants/notifications'
import { createAdvisor } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

const LEGACY_TYPES = ['pdf_export_completed', 'exercise_completed', 'ai_synthesis_ready'] as const

test.group('notifications_type_check', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la contrainte autorise chaque NOTIFICATION_TYPES', async ({ assert }) => {
    const rows = await db
      .from('pg_constraint')
      .where('conname', 'notifications_type_check')
      .select(db.raw('pg_get_constraintdef(oid) as condef'))

    assert.lengthOf(rows, 1)
    for (const type of notificationTypeValues) {
      assert.include(rows[0].condef, `'${type}'`)
    }
  })

  test('le resync accepte appointment_scheduled après la contrainte d’origine', async ({
    assert,
  }) => {
    const user = await createAdvisor()
    const trx = await db.transaction()

    try {
      for (const sql of notificationTypeCheckStatements(LEGACY_TYPES)) {
        await trx.rawQuery(sql)
      }

      // Savepoint : un INSERT refusé annule toute la transaction tant qu'on
      // n'est pas revenu au savepoint.
      const attempt = await trx.transaction()
      try {
        await Notification.create(
          {
            userId: user.id,
            type: NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED,
            status: NOTIFICATION_STATUSES.UNREAD,
            title: 'Rendez-vous',
            body: null,
            meta: null,
          },
          { client: attempt }
        )
        assert.fail('la contrainte d’origine aurait dû refuser appointment_scheduled')
      } catch (error) {
        if ((error as { code?: string }).code !== '23514') throw error
      } finally {
        if (!attempt.isCompleted) await attempt.rollback()
      }

      for (const sql of notificationTypeCheckStatements(notificationTypeValues)) {
        await trx.rawQuery(sql)
      }

      const created = await Notification.create(
        {
          userId: user.id,
          type: NOTIFICATION_TYPES.STEP_UNLOCKED,
          status: NOTIFICATION_STATUSES.UNREAD,
          title: 'Étape',
          body: null,
          meta: null,
        },
        { client: trx }
      )
      assert.equal(created.type, NOTIFICATION_TYPES.STEP_UNLOCKED)
    } finally {
      await trx.rollback()
    }
  })
})
