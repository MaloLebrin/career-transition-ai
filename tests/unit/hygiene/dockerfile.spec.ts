import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { execFile } from 'node:child_process'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

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

/**
 * Exécute l'entrypoint avec un faux `node` qui journalise ses arguments :
 * renvoie les commandes node lancées, dans l'ordre.
 */
async function runEntrypoint(args: string[], env: Record<string, string> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'entrypoint-'))
  const log = join(dir, 'calls.log')
  const fakeNode = join(dir, 'node')
  await writeFile(fakeNode, `#!/bin/sh\necho "$*" >> "${log}"\n`)
  await chmod(fakeNode, 0o755)
  try {
    await promisify(execFile)('sh', [app.makePath('docker/entrypoint.sh'), ...args], {
      env: { PATH: `${dir}:/usr/bin:/bin`, ...env },
    })
    const calls = await readFile(log, 'utf-8').catch(() => '')
    return calls.trim().split('\n').filter(Boolean)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
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

  test('server seul ne migre pas', async ({ assert }) => {
    assert.deepEqual(await runEntrypoint(['server']), ['bin/server.js'])
  })

  test('migrate-and-serve fonctionne quand Render répète le chemin de l’entrypoint', async ({
    assert,
  }) => {
    // dockerCommand Render = CMD : l'ENTRYPOINT reçoit `/entrypoint.sh migrate-and-serve`.
    assert.deepEqual(await runEntrypoint(['/entrypoint.sh', 'migrate-and-serve']), [
      'ace.js migration:run --force',
      'bin/server.js',
    ])
  })

  test('RUN_MIGRATIONS_ON_BOOT=true fait migrer le mode server par défaut', async ({ assert }) => {
    const expected = ['ace.js migration:run --force', 'bin/server.js']

    assert.deepEqual(await runEntrypoint([], { RUN_MIGRATIONS_ON_BOOT: 'true' }), expected)
    assert.deepEqual(await runEntrypoint(['server'], { RUN_MIGRATIONS_ON_BOOT: 'true' }), expected)
    assert.deepEqual(await runEntrypoint(['worker'], { RUN_MIGRATIONS_ON_BOOT: 'true' }), [
      'ace.js queue:work --queue=default,ai,pdfs,analytics',
    ])
  })

  test('render.yaml démarre en migrate-and-serve avec le filet RUN_MIGRATIONS_ON_BOOT', async ({
    assert,
  }) => {
    const render = await read('render.yaml')

    assert.match(render, /dockerCommand: \/entrypoint\.sh migrate-and-serve/)
    assert.match(render, /key: RUN_MIGRATIONS_ON_BOOT\n\s+value: 'true'/)
  })

  test('@google/genai n’est plus une dépendance', async ({ assert }) => {
    const pkg = JSON.parse(await read('package.json'))

    assert.notProperty(pkg.dependencies ?? {}, '@google/genai')
    assert.notProperty(pkg.devDependencies ?? {}, '@google/genai')
  })
})
