import type Employee from '#models/employee'
import archiver from 'archiver'
import { generateProfilPdf, generateResultPdf } from '#domains/dossier/services/dossier_pdf_service'

/**
 * Builds a ZIP archive (readable stream) containing profil.pdf and resultats/<type>.pdf.
 * The caller should await this and then pipe the result to the response.
 */
export async function buildDossierArchive(employee: Employee): Promise<archiver.Archiver> {
  const archive = archiver('zip', { zlib: { level: 9 } })

  const profilPdf = await generateProfilPdf(employee)
  archive.append(profilPdf, { name: 'profil.pdf' })

  const results = employee.exerciseResults || []
  for (const result of results) {
    const pdfBuffer = await generateResultPdf(result)
    archive.append(pdfBuffer, { name: `resultats/${result.type}.pdf` })
  }

  archive.finalize()
  return archive
}

/**
 * Safe filename for ZIP: Dossier_Jean_Dupont.zip
 */
export function dossierZipFilename(employeeName: string): string {
  const safe = employeeName.replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '')
  return `Dossier_${safe || 'candidat'}.zip`
}

