import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'
import type { InferDriveDisks } from '@adonisjs/drive/types'

/**
 * Stockage des fichiers générés (exports PDF), issue #21.
 *
 * - `fs` (défaut) : disque local `storage/`, pour le dev, les tests et un
 *   déploiement mono-machine ou web + worker partageant un volume.
 * - `s3` : bucket compatible S3 (Cloudflare R2…), quand web et worker sont
 *   deux services sans disque commun (PaaS, `render.yaml`).
 *
 * Les fichiers sont **privés** : ils ne sont jamais servis directement, le
 * téléchargement passe par `PdfExportDownloadsController` (contrôle d'accès).
 * En base, on ne stocke qu'une clé relative (`exports/…`), jamais un chemin
 * absolu.
 */
const disk = env.get('DRIVE_DISK', 'fs')

/** Variables du disque `s3`, requises seulement quand il est actif. */
export const S3_REQUIRED_ENV = [
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_ENDPOINT',
] as const

/** Variables `S3_*` manquantes pour le disque choisi (toujours vide pour `fs`). */
export function missingS3Env(
  selected: string,
  read: (name: (typeof S3_REQUIRED_ENV)[number]) => string | undefined
): string[] {
  if (selected !== 's3') return []
  return S3_REQUIRED_ENV.filter((name) => !read(name))
}

const missing = missingS3Env(disk, (name) => env.get(name))
if (missing.length > 0) {
  throw new Error(`DRIVE_DISK=s3 : variables manquantes (${missing.join(', ')})`)
}

const driveConfig = defineConfig({
  default: disk,

  /** `drive.fake()` en test écrit ici. */
  fakes: {
    location: app.tmpPath('drive-fakes'),
  },

  services: {
    fs: services.fs({
      location: app.makePath('storage'),
      visibility: 'private',
      serveFiles: false,
    }),

    s3: services.s3({
      credentials: {
        accessKeyId: env.get('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('S3_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('S3_REGION', 'auto'),
      bucket: env.get('S3_BUCKET', ''),
      endpoint: env.get('S3_ENDPOINT'),
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
