import queueConfig from '#config/queue'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { glob } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, isAbsolute } from 'node:path'

/**
 * Garde de l'emplacement des jobs de queue.
 *
 * `@boringnode/queue` globbe `locations` relativement au `cwd` du process. Un
 * motif relatif ne trouve les jobs que si le worker est lancé depuis la racine
 * du dépôt et casse depuis `build/` (procédure `cd build && node bin/console.js
 * queue:work`) : aucun job enregistré, avertissement « No jobs found for
 * locations », jobs jamais traités. Les motifs doivent donc être absolus, résolus
 * par rapport à la racine de l'app.
 *
 * Non-régression de l'issue #11.
 */

async function collect(pattern: string, cwd: string): Promise<string[]> {
  const files: string[] = []
  for await (const file of glob(pattern, { cwd })) files.push(basename(file))
  return files.sort()
}

test.group('Hygiène — emplacement des jobs de queue', () => {
  test('les locations sont absolues et résolues depuis la racine de l’app', ({ assert }) => {
    assert.isNotEmpty(queueConfig.locations)
    for (const location of queueConfig.locations!) {
      assert.isTrue(isAbsolute(location), `${location} doit être un chemin absolu`)
      assert.isTrue(
        location.startsWith(app.makePath('app/jobs')),
        `${location} doit pointer sous ${app.makePath('app/jobs')}`
      )
    }
  })

  test('les jobs sont trouvés quel que soit le cwd du process', async ({ assert }) => {
    const expected = await collect('app/jobs/**/*.ts', app.makePath())
    assert.isNotEmpty(expected)

    // Même motif que le worker, mais globbé depuis un répertoire étranger au
    // dépôt : un chemin relatif ne trouverait rien ici.
    const perLocation = await Promise.all(
      queueConfig.locations!.map((location) => collect(location, tmpdir()))
    )
    const found = perLocation.flat().sort()

    assert.deepEqual(found, expected)
  })
})
