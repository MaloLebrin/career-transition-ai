import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs du stockage de fichiers (`#services/cloudinary_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 *
 * Volontairement absentes de `ignoreCodes` : ce sont des pannes (5xx), pas des
 * erreurs de saisie, et elles doivent remonter dans Sentry.
 */

/** `CLOUDINARY_*` absentes (dev ou test sans identifiants) → 503. */
export class CloudinaryNotConfiguredError extends DomainException {
  constructor() {
    super(
      'Stockage des fichiers non configuré : renseigner CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.',
      { status: 503, code: 'E_STORAGE_NOT_CONFIGURED' }
    )
  }
}

/** Réponse inattendue de Cloudinary au téléchargement → 502. */
export class CloudinaryDownloadError extends DomainException {
  constructor(status: number) {
    super(`Téléchargement du fichier impossible (Cloudinary a répondu ${status}).`, {
      status: 502,
      code: 'E_STORAGE_DOWNLOAD_FAILED',
    })
  }
}
