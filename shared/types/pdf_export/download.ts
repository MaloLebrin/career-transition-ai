import type { Readable } from 'node:stream'

/** Fichier PDF prêt à être relayé au navigateur (`PdfExportDownloadsService.open`). */
export interface PdfExportDownload {
  stream: Readable
  fileName: string
  mimeType: string
}
