import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier des exports PDF (`#services/pdf_export_downloads_service`).
 *
 * Elles étendent `DomainException` : `handler.ts` les traduit en flash +
 * redirect back sur une requête Inertia, en `{ message }` + statut sinon.
 */

/**
 * Export absent, hors de portée de l'utilisateur (autre organisation, autre
 * candidat) ou fichier manquant → 404, jamais 403 : la réponse ne doit pas
 * confirmer l'existence d'un export qu'on ne peut pas lire.
 */
export class PdfExportNotFoundError extends DomainException {
  constructor(message: string = 'Export PDF introuvable.') {
    super(message, { status: 404, code: 'E_PDF_EXPORT_NOT_FOUND' })
  }
}

/** Export accessible mais pas encore généré (ou en échec) → 409. */
export class PdfExportNotReadyError extends DomainException {
  constructor(message: string = 'L’export PDF n’est pas encore disponible.') {
    super(message, { status: 409, code: 'E_PDF_EXPORT_NOT_READY' })
  }
}
