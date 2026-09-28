import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { access, glob, readFile } from 'node:fs/promises'

/**
 * Garde du stockage de fichiers (issue #49).
 *
 * Cloudinary est le seul stockage (`#services/cloudinary_service`). L'ancien
 * système — `@adonisjs/drive` (disques `fs`/`s3`), dossier `storage/`,
 * `DRIVE_DISK`, `S3_*` — a été retiré : cette garde échoue s'il réapparaît
 * dans le code, les tests ou la configuration de déploiement.
 */
const CODE_GLOBS = [
  'app/**/*.ts',
  'config/**/*.ts',
  'database/**/*.ts',
  'shared/**/*.ts',
  'start/**/*.ts',
  'tests/**/*.ts',
  'inertia/**/*.{ts,tsx}',
]

const CONFIG_FILES = [
  'package.json',
  'adonisrc.ts',
  '.env.example',
  '.env.production.example',
  'deploy/.env.example',
  'deploy/compose.yml',
  'Dockerfile',
  'scripts/smoke_compose_prod.sh',
  '.github/workflows/ci.yml',
]

const FORBIDDEN = [/@adonisjs\/drive/, /@aws-sdk\//, /\bDRIVE_DISK\b/, /\bS3_[A-Z]/]

const SELF = 'tests/unit/hygiene/file_storage.spec.ts'

async function offendersIn(files: string[]) {
  const offenders: string[] = []
  for (const file of files) {
    const contents = await readFile(app.makePath(file), 'utf-8')
    const hit = FORBIDDEN.find((pattern) => pattern.test(contents))
    if (hit) offenders.push(`${file} (${hit.source})`)
  }
  return offenders
}

test.group('Hygiène — stockage de fichiers', () => {
  test('ni Drive ni S3 dans le code et les tests', async ({ assert }) => {
    const files: string[] = []
    for (const pattern of CODE_GLOBS) {
      for await (const file of glob(pattern, { cwd: app.makePath() })) {
        if (file !== SELF) files.push(file)
      }
    }

    assert.deepEqual(await offendersIn(files), [], 'passer par #services/cloudinary_service')
  })

  test('ni Drive ni S3 dans les dépendances, l’env et le déploiement', async ({ assert }) => {
    assert.deepEqual(await offendersIn(CONFIG_FILES), [])
  })

  test('plus de config/drive.ts', async ({ assert }) => {
    await assert.rejects(() => access(app.makePath('config/drive.ts')))
  })
})
