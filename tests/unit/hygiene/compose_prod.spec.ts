import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { access, constants, readFile } from 'node:fs/promises'

/**
 * Garde du compose de production (`deploy/`, issue #16).
 *
 * Le job CI `docker-image` démarre la pile ; cette garde échoue plus tôt, en
 * local, si une modification retire un invariant : aucun volume dans `app` ni
 * `worker` (PDF sur S3/R2), healthcheck HTTP réservé à `app`, `migrate`/`seed`
 * en one-shot, redémarrage automatique, SSE non bufferisés par Caddy.
 */
async function read(path: string) {
  return readFile(app.makePath(path), 'utf-8')
}

/** Bloc YAML d'un service de `services:` (indentation à deux espaces). */
function serviceBlock(compose: string, name: string) {
  const services = compose.slice(compose.indexOf('\nservices:'))
  const match = services.match(new RegExp(`^  ${name}:\\n((?:(?:    .*)?\\n)*)`, 'm'))
  return match?.[1] ?? null
}

const SERVICES = ['postgres', 'migrate', 'seed', 'app', 'worker', 'caddy']

test.group('Hygiène — compose de production', () => {
  test('déclare les services attendus', async ({ assert }) => {
    const compose = await read('deploy/compose.yml')

    for (const name of SERVICES) {
      assert.isNotNull(serviceBlock(compose, name), `service ${name} absent de deploy/compose.yml`)
    }
  })

  test('aucun volume dans app ni worker : PDF sur S3', async ({ assert }) => {
    const compose = await read('deploy/compose.yml')

    for (const name of ['app', 'worker', 'migrate', 'seed']) {
      assert.notMatch(serviceBlock(compose, name)!, /^\s+volumes:/m, `volume dans ${name}`)
    }
    assert.notMatch(serviceBlock(compose, 'app')!, /build:/)
  })

  test('healthcheck HTTP réservé à app', async ({ assert }) => {
    const compose = await read('deploy/compose.yml')

    assert.match(serviceBlock(compose, 'app')!, /healthcheck:[\s\S]*\/health/)
    for (const name of ['worker', 'migrate', 'seed']) {
      assert.include(
        serviceBlock(compose, name)!,
        '*no-healthcheck',
        `${name} hérite du HEALTHCHECK`
      )
    }
    assert.match(compose, /x-no-healthcheck: &no-healthcheck\n\s+healthcheck:\n\s+disable: true/)
  })

  test('migrate et seed sont des one-shot du profil ops', async ({ assert }) => {
    const compose = await read('deploy/compose.yml')

    for (const name of ['migrate', 'seed']) {
      const block = serviceBlock(compose, name)!
      assert.include(block, `command: ${name}`)
      assert.include(block, 'profiles: [ops]')
      assert.include(block, "restart: 'no'")
    }
  })

  test('les services longs redémarrent automatiquement', async ({ assert }) => {
    const compose = await read('deploy/compose.yml')

    for (const name of ['postgres', 'app', 'worker', 'caddy']) {
      assert.include(serviceBlock(compose, name)!, 'restart: unless-stopped', name)
    }
  })

  test('Caddy ne bufferise pas les SSE', async ({ assert }) => {
    const caddyfile = await read('deploy/Caddyfile')

    assert.match(caddyfile, /reverse_proxy app:8080 \{[\s\S]*flush_interval -1/)
  })

  test('backup.sh est exécutable', async ({ assert }) => {
    await assert.doesNotReject(() => access(app.makePath('deploy/backup.sh'), constants.X_OK))
  })
})
