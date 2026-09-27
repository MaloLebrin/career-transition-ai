import queueConfig from '#config/queue'
import { envSchema } from '#start/env_schema'
import { EnvParser } from '@adonisjs/core/env'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'

/**
 * Garde du schéma d'env et des fichiers d'exemple (issue #17).
 *
 * `cp .env.example .env` doit démarrer, et `.env.production.example` doit
 * couvrir ce que la production exige. Chaque clé est validée par la règle du
 * schéma avec la valeur du fichier : `Env.rules().validate()` préférerait les
 * valeurs de `process.env` (celles de l'env de test).
 */

type EnvKey = keyof typeof envSchema
type Rule = (key: string, value?: string) => unknown

/** Variables hors schéma, lues par Node, Vite ou l'hébergeur. */
const OUTSIDE_SCHEMA = ['TZ', 'NODE_OPTIONS', 'VITE_APP_NAME']
/** Variables lues par docker compose (deploy/compose.yml), pas par l'application. */
const COMPOSE_ONLY: Record<string, string[]> = {
  'deploy/.env.example': ['APP_IMAGE', 'APP_DOMAIN'],
}
/** Variables du schéma injectées par l'hébergeur, absentes des exemples. */
const HOST_INJECTED: EnvKey[] = ['RENDER_GIT_COMMIT']

async function parseEnvFile(name: string): Promise<Record<string, string>> {
  const contents = await readFile(app.makePath(name), 'utf-8')
  return new EnvParser(contents, new URL(app.makeURL()), { ignoreProcessEnv: true }).parse()
}

/** Clés actives et commentées (`# KEY=`) : le fichier documente toutes les variables. */
async function documentedKeys(name: string): Promise<string[]> {
  const contents = await readFile(app.makePath(name), 'utf-8')
  return [...contents.matchAll(/^#?\s*([A-Z][A-Z0-9_]*)=/gm)].map(([, key]) => key)
}

function validate(values: Record<string, string>): {
  errors: string[]
  parsed: Record<string, unknown>
} {
  const errors: string[] = []
  const parsed: Record<string, unknown> = {}
  for (const [key, rule] of Object.entries(envSchema) as [EnvKey, Rule][]) {
    try {
      parsed[key] = rule(key, values[key])
    } catch (error) {
      errors.push((error as Error).message)
    }
  }
  return { errors, parsed }
}

for (const file of ['.env.example', '.env.production.example', 'deploy/.env.example']) {
  test.group(`Env — ${file}`, () => {
    test('passe la validation du schéma', async ({ assert }) => {
      const { errors } = validate(await parseEnvFile(file))
      assert.deepEqual(errors, [])
    })

    test('ne laisse aucune variable active vide', async ({ assert }) => {
      const values = await parseEnvFile(file)
      const empty = Object.entries(values)
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => key)
      assert.deepEqual(empty, [], 'commenter la ligne plutôt que la laisser vide')
    })

    test('ne contient que des variables connues', async ({ assert }) => {
      const keys = await documentedKeys(file)
      const allowed = [...OUTSIDE_SCHEMA, ...(COMPOSE_ONLY[file] ?? [])]
      const unknown = keys.filter((key) => !(key in envSchema) && !allowed.includes(key))
      assert.deepEqual(unknown, [], 'variables inconnues du schéma (start/env_schema.ts)')
    })

    test('fuseau horaire IANA, pas de notation POSIX', async ({ assert }) => {
      const values = await parseEnvFile(file)
      assert.equal(values.TZ, 'Europe/Paris')
    })
  })
}

test.group('Env — .env.example', () => {
  test('documente toutes les variables du schéma', async ({ assert }) => {
    const keys = await documentedKeys('.env.example')
    const missing = (Object.keys(envSchema) as EnvKey[]).filter(
      (key) => !HOST_INJECTED.includes(key) && !keys.includes(key)
    )
    assert.deepEqual(missing, [], 'ajouter la variable (commentée si optionnelle) à .env.example')
  })
})

for (const file of ['.env.production.example', 'deploy/.env.example']) {
  test.group(`Env — ${file} (production)`, () => {
    test('cible la production avec expéditeur et inscription fermée', async ({ assert }) => {
      const { parsed } = validate(await parseEnvFile(file))
      assert.equal(parsed.NODE_ENV, 'production')
      assert.equal(parsed.REGISTRATION_ENABLED, false)
      assert.isString(parsed.MAIL_FROM_EMAIL)
      assert.isNotEmpty(parsed.MAIL_FROM_EMAIL)
    })
  })
}

test.group('Env — deploy/.env.example (compose)', () => {
  test('Postgres du compose sans TLS, PDF sur S3 (aucun volume)', async ({ assert }) => {
    const { parsed } = validate(await parseEnvFile('deploy/.env.example'))
    assert.equal(parsed.DB_HOST, 'postgres')
    assert.equal(parsed.DB_SSL, false)
    assert.equal(parsed.DRIVE_DISK, 's3')
    assert.equal(parsed.QUEUE_DRIVER, 'database')
  })
})

test.group('Env — QUEUE_DRIVER', () => {
  const rule = envSchema.QUEUE_DRIVER as Rule

  test('refuse redis (aucun adapter configuré)', ({ assert }) => {
    assert.throws(() => rule('QUEUE_DRIVER', 'redis'))
  })

  test('chaque valeur acceptée a un adapter dans config/queue.ts', ({ assert }) => {
    for (const driver of Object.keys(queueConfig.adapters)) {
      assert.doesNotThrow(() => rule('QUEUE_DRIVER', driver))
    }
    for (const driver of ['database', 'sync']) {
      assert.property(queueConfig.adapters, driver)
    }
  })
})
