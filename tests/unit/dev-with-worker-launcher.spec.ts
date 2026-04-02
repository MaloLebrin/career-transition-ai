import { test } from '@japa/runner'

test.group('dev-with-worker launcher', () => {
  test('buildQueueWorkAceArgs builds queue args', async ({ assert }) => {
    const mod = await import('../../bin/dev-with-worker.mjs')

    assert.deepEqual(mod.buildQueueWorkAceArgs(), ['queue:work'])
    assert.deepEqual(mod.buildQueueWorkAceArgs({ queueNames: ['ai'] }), [
      'queue:work',
      '--queue=ai',
    ])
    assert.deepEqual(mod.buildQueueWorkAceArgs({ queueNames: ['ai', 'analytics'] }), [
      'queue:work',
      '--queue=ai,analytics',
    ])
  })

  test('buildQueueWorkAceArgs builds concurrency args', async ({ assert }) => {
    const mod = await import('../../bin/dev-with-worker.mjs')

    assert.deepEqual(mod.buildQueueWorkAceArgs({ concurrency: 10 }), [
      'queue:work',
      '--concurrency=10',
    ])
  })

  test('buildServeAceArgs builds serve args', async ({ assert }) => {
    const mod = await import('../../bin/dev-with-worker.mjs')

    assert.deepEqual(mod.buildServeAceArgs(), ['serve', '--hmr'])
  })
})

