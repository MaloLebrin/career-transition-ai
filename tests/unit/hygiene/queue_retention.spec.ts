import queueConfig, { QUEUE_JOB_RETENTION } from '#config/queue'
import { KnexAdapter } from '@boringnode/queue/drivers/knex_adapter'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

/**
 * Rétention des jobs terminés dans `queue_jobs` (issue #28).
 *
 * Par défaut `@boringnode/queue` supprime tout job terminé, échecs compris :
 * on garde un historique borné en âge et en nombre. Les tests passent par le
 * vrai adaptateur Knex sur PostgreSQL, sur une queue dédiée nettoyée après
 * chaque test (l'adaptateur a sa propre connexion, hors transaction globale).
 */

const QUEUE = 'test-retention'
const DAY_MS = 24 * 60 * 60 * 1000

function adapter() {
  return new KnexAdapter({ connection: db.connection().getWriteClient() })
}

function jobs() {
  return db.from('queue_jobs').where('queue', QUEUE)
}

/** Pousse puis prend un job : il est `active`, prêt à être terminé. */
async function runJob(queue: KnexAdapter): Promise<string> {
  const id = randomUUID()
  await queue.pushOn(QUEUE, { id, name: 'TestJob', payload: {}, attempts: 0 })
  const acquired = await queue.popFrom(QUEUE)
  return acquired!.id
}

async function ageJob(id: string, days: number) {
  await db
    .from('queue_jobs')
    .where('id', id)
    .update({ finished_at: Date.now() - days * DAY_MS })
}

test.group('Hygiène — rétention des jobs de queue', (group) => {
  group.each.teardown(async () => {
    await jobs().delete()
  })

  test('la config globale garde succès et échecs avec une limite d’âge et de nombre', ({
    assert,
  }) => {
    assert.deepEqual(queueConfig.defaultJobOptions?.removeOnComplete, {
      age: '7d',
      count: 1000,
    })
    assert.deepEqual(queueConfig.defaultJobOptions?.removeOnFail, { age: '30d', count: 1000 })
  })

  test('un job réussi est conservé, puis élagué après 7 jours', async ({ assert }) => {
    const queue = adapter()

    const oldId = await runJob(queue)
    await queue.completeJob(oldId, QUEUE, QUEUE_JOB_RETENTION.completed)
    const [kept] = await jobs().where('id', oldId)
    assert.equal(kept.status, 'completed')

    await ageJob(oldId, 8)
    const recentId = await runJob(queue)
    await queue.completeJob(recentId, QUEUE, QUEUE_JOB_RETENTION.completed)

    const remaining = await jobs().select('id')
    assert.deepEqual(
      remaining.map((row) => row.id),
      [recentId]
    )
  })

  test('un job en échec garde son erreur 30 jours', async ({ assert }) => {
    const queue = adapter()

    const failedId = await runJob(queue)
    await queue.failJob(
      failedId,
      QUEUE,
      new Error('Mistral indisponible'),
      QUEUE_JOB_RETENTION.failed
    )
    await ageJob(failedId, 20)

    const otherId = await runJob(queue)
    await queue.failJob(otherId, QUEUE, new Error('boom'), QUEUE_JOB_RETENTION.failed)

    const [failed] = await jobs().where('id', failedId)
    assert.equal(failed.status, 'failed')
    assert.equal(failed.error, 'Mistral indisponible')

    await ageJob(failedId, 31)
    const lastId = await runJob(queue)
    await queue.failJob(lastId, QUEUE, new Error('boom'), QUEUE_JOB_RETENTION.failed)
    assert.lengthOf(await jobs().where('id', failedId), 0)
    assert.lengthOf(await jobs(), 2)
  })

  test('le nombre de jobs conservés par queue est borné', async ({ assert }) => {
    const queue = adapter()

    for (let i = 0; i < 4; i++) {
      const id = await runJob(queue)
      await queue.completeJob(id, QUEUE, { ...QUEUE_JOB_RETENTION.completed, count: 2 })
    }

    assert.lengthOf(await jobs(), 2)
  })
})
