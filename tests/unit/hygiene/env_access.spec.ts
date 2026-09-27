import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { glob, readFile } from 'node:fs/promises'

/**
 * Garde de l'accès aux variables d'env (issue #17).
 *
 * Le code serveur lit l'env via `env.get` (`#start/env`) : les variables sont
 * déclarées et validées au boot (start/env_schema.ts), une valeur manquante ou
 * invalide échoue au démarrage au lieu d'au premier envoi d'e-mail. `NODE_ENV`
 * se lit via `app.inProduction` / `app.inTest`. Les scripts (`bin/`,
 * `scripts/`) tournent hors de l'app et ne sont pas concernés.
 */
const SERVER_DIRS = ['app', 'config', 'database', 'start']

test.group('Hygiène — accès aux variables d’env', () => {
  test('aucun process.env dans le code serveur', async ({ assert }) => {
    const offenders: string[] = []
    for (const dir of SERVER_DIRS) {
      for await (const file of glob(`${dir}/**/*.ts`, { cwd: app.makePath() })) {
        const contents = await readFile(app.makePath(file), 'utf-8')
        if (contents.includes('process.env')) offenders.push(file)
      }
    }
    assert.deepEqual(offenders, [], 'utiliser env.get (#start/env) plutôt que process.env')
  })
})
