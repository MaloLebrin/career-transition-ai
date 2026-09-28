import { QUEUE_NAMES, QUEUE_NAMES_LIST, type QueueName } from '#utils/queues/queue_names'
import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

test.group('utils/queues/queue_names', () => {
  test('les quatre workers documentés existent', ({ assert }) => {
    assert.deepEqual([...QUEUE_NAMES_LIST].sort(), ['ai', 'analytics', 'default', 'pdfs'])
  })

  test('chaque clé porte le même nom que sa file (pas de valeur divergente)', ({ assert }) => {
    for (const [key, value] of Object.entries(QUEUE_NAMES)) {
      assert.equal(key, value)
    }
  })

  test('QUEUE_NAMES_LIST suit l’objet, sans doublon', ({ assert }) => {
    assert.deepEqual(QUEUE_NAMES_LIST, Object.values(QUEUE_NAMES))
    assert.equal(new Set(QUEUE_NAMES_LIST).size, QUEUE_NAMES_LIST.length)
  })

  test('`pnpm dev:worker:all` écoute toutes les files (aucun job orphelin)', async ({ assert }) => {
    const pkg = JSON.parse(await readFile(app.makePath('package.json'), 'utf8'))
    const match = /--queue=([\w,]+)/.exec(pkg.scripts['dev:worker:all'])
    assert.isNotNull(match)
    const listened = match![1].split(',').sort()
    assert.deepEqual(listened, [...QUEUE_NAMES_LIST].sort())
  })

  test('QueueName accepte chaque valeur de la liste', ({ assert }) => {
    const names: QueueName[] = [...QUEUE_NAMES_LIST]
    assert.lengthOf(names, 4)
  })
})
