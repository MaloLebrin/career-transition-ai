import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'

/**
 * Garde de l'image Docker (issue #14).
 *
 * Le job CI `docker-image` construit et démarre l'image ; cette garde échoue
 * plus tôt, en local, si une modification du Dockerfile ou de l'entrypoint
 * retire un des durcissements : utilisateur non root, HEALTHCHECK, env de
 * production, migrations sorties du démarrage du serveur.
 */
async function read(path: string) {
  return readFile(app.makePath(path), 'utf-8')
}

/** Instructions du dernier stage (celui qui est livré). */
function finalStage(dockerfile: string) {
  const stages = dockerfile.split(/^FROM /m)
  return stages.at(-1) ?? ''
}

/** Corps de la branche `mode)` du `case` de l'entrypoint. */
function modeBranch(entrypoint: string, mode: string) {
  const match = entrypoint.match(new RegExp(`^\\s*${mode}\\)([\\s\\S]*?);;`, 'm'))
  return match?.[1] ?? null
}

test.group('Hygiène — image Docker', () => {
  test('le stage final tourne en node, avec HEALTHCHECK et env de production', async ({
    assert,
  }) => {
    const dockerfile = await read('Dockerfile')
    const stage = finalStage(dockerfile)

    assert.match(stage, /^USER node$/m)
    assert.match(stage, /^HEALTHCHECK .*\n?.*\/health/m)
    assert.match(stage, /^ENV .*NODE_ENV=production/m)
    assert.match(stage, /^ENV .*HOST=0\.0\.0\.0/m)
    assert.match(stage, /pnpm install --prod --frozen-lockfile/)
  })

  test('l’entrypoint gère server, worker, migrate et seed', async ({ assert }) => {
    const entrypoint = await read('docker/entrypoint.sh')

    for (const mode of ['server', 'worker', 'migrate', 'seed']) {
      const branch = modeBranch(entrypoint, mode)
      assert.isNotNull(branch, `mode ${mode} absent de docker/entrypoint.sh`)
      assert.match(branch!, /\bexec node /, `mode ${mode} : lancer node via exec (PID 1)`)
    }

    assert.match(modeBranch(entrypoint, 'migrate')!, /migration:run --force/)
    assert.match(modeBranch(entrypoint, 'seed')!, /db:seed --files database\/seeders\/admin_seeder/)
  })

  test('migrate-and-serve migre puis exécute le serveur (hébergeurs sans pré-déploiement)', async ({
    assert,
  }) => {
    const entrypoint = await read('docker/entrypoint.sh')
    const branch = modeBranch(entrypoint, 'migrate-and-serve')

    assert.isNotNull(branch)
    assert.match(branch!, /migration:run --force[\s\S]*exec node bin\/server\.js/)
  })

  test('le serveur ne lance pas les migrations au démarrage', async ({ assert }) => {
    const entrypoint = await read('docker/entrypoint.sh')

    assert.notInclude(modeBranch(entrypoint, 'server')!, 'migration:run')
  })

  test('@google/genai n’est plus une dépendance', async ({ assert }) => {
    const pkg = JSON.parse(await read('package.json'))

    assert.notProperty(pkg.dependencies ?? {}, '@google/genai')
    assert.notProperty(pkg.devDependencies ?? {}, '@google/genai')
  })
})
