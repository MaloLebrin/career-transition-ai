import Media from '#models/media'
import type Employee from '#models/employee'
import { MEDIA_ENTITY_TYPES } from '#shared/constants/media'

/** PDF minimal : le bodyparser détecte le type réel du fichier envoyé. */
export const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
)

/** Documents (`media`) d'une fiche candidat, du plus ancien au plus récent. */
export function documentsOf(employee: Employee) {
  return Media.query()
    .where('entityType', MEDIA_ENTITY_TYPES.EMPLOYEE)
    .where('entityId', employee.id)
    .orderBy('id', 'asc')
}
