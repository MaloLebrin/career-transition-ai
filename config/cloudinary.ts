import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { v2 as cloudinary } from 'cloudinary'

/**
 * Stockage des fichiers (exports PDF, puis logo et documents candidat) sur
 * Cloudinary, issue #49 — seul stockage de l'application, y compris en dev
 * (dossier `career-transition/dev`). Aucun disque local : web et worker n'ont
 * rien à partager.
 *
 * Les fichiers candidat sont **privés** (`type: 'authenticated'`) : l'URL
 * Cloudinary n'est pas lisible sans signature, et seul le serveur la signe,
 * après contrôle d'accès (`#services/cloudinary_service`). Voir
 * docs/CLOUDINARY.md.
 */
export const CLOUDINARY_REQUIRED_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const

/** Variables `CLOUDINARY_*` absentes ou vides. */
export function missingCloudinaryEnv(
  read: (name: (typeof CLOUDINARY_REQUIRED_ENV)[number]) => string | undefined
): string[] {
  return CLOUDINARY_REQUIRED_ENV.filter((name) => !read(name))
}

/**
 * En production, un démarrage sans identifiants échouerait au premier export :
 * on refuse de démarrer. Ailleurs l'app démarre, et seul un appel au stockage
 * échoue (`CloudinaryNotConfiguredError`).
 */
const missing = missingCloudinaryEnv((name) => env.get(name))
if (app.inProduction && missing.length > 0) {
  throw new Error(`Cloudinary : variables manquantes (${missing.join(', ')})`)
}

cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
  api_key: env.get('CLOUDINARY_API_KEY'),
  api_secret: env.get('CLOUDINARY_API_SECRET'),
  secure: true,
})

export default cloudinary
