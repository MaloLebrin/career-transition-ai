import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'

/**
 * Garde du blueprint Render (`render.yaml`, issue #20).
 *
 * Il décrit le scénario 1 du runbook (`docs/DEPLOYMENT.md` §1) : un seul web
 * service en plan Free, base Neon (`DB_URL`), `QUEUE_DRIVER=sync`, migrations
 * et seed au démarrage (le plan Free n'a pas de pre-deploy command). L'ancien
 * blueprint (plans `starter` payants, Postgres Render, worker) n'était plus
 * aligné sur le runbook.
 */
async function read(path: string) {
  return readFile(app.makePath(path), 'utf-8')
}

/** Variables lues par Node lui-même (fuseau, mémoire), hors schéma d'env AdonisJS. */
const RUNTIME_ONLY = ['NODE_OPTIONS', 'TZ']

test.group('Hygiène — blueprint Render', () => {
  test('plan Free uniquement, sans base Render ni worker', async ({ assert }) => {
    const blueprint = await read('render.yaml')

    const plans = [...blueprint.matchAll(/^\s*plan:\s*(\S+)/gm)].map(([, plan]) => plan)
    assert.isNotEmpty(plans)
    assert.deepEqual([...new Set(plans)], ['free'])
    assert.notMatch(blueprint, /^databases:/m)
    assert.notMatch(blueprint, /type:\s*worker/)
    assert.notMatch(blueprint, /preDeployCommand/)
  })

  test('health check, migrations puis serveur au démarrage', async ({ assert }) => {
    const blueprint = await read('render.yaml')

    assert.match(blueprint, /healthCheckPath:\s*\/health\b/)
    const start = blueprint.match(/startCommand:\s*(.+)/)?.[1] ?? ''
    const migrate = start.indexOf('migration:run --force')
    assert.isAbove(migrate, -1, 'startCommand sans migration:run --force')
    assert.isAbove(start.indexOf('bin/server.js'), migrate)
  })

  test('toutes les variables sont déclarées dans start/env_schema.ts', async ({ assert }) => {
    const blueprint = await read('render.yaml')
    const schema = await read('start/env_schema.ts')

    const keys = [...blueprint.matchAll(/-\s*key:\s*(\w+)/g)].map(([, key]) => key)
    assert.includeMembers(keys, ['DB_URL', 'QUEUE_DRIVER', 'APP_KEY', 'CLOUDINARY_CLOUD_NAME'])
    const undeclared = keys.filter(
      (key) => !RUNTIME_ONLY.includes(key) && !new RegExp(`^\\s*${key}:`, 'm').test(schema)
    )
    assert.deepEqual(undeclared, [])
  })
})
