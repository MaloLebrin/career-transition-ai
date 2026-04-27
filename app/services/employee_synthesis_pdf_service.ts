import type { EmployeeSynthesisPayload } from '#services/employee_synthesis_service'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const sanitizeToWinAnsi = (input: string) => {
  // pdf-lib standard fonts use WinAnsi encoding; replace common non-encodable chars.
  return (input ?? '')
    .replace(/\u2192/g, '->') // →
    .replace(/[\u2018\u2019]/g, "'") // ‘ ’
    .replace(/[\u201C\u201D]/g, '"') // “ ”
    .replace(/\u2013/g, '-') // –
    .replace(/\u2014/g, '--') // —
    .replace(/\u2026/g, '...') // …
    .replace(/\u00A0/g, ' ') // nbsp
}

export class EmployeeSynthesisPdfService {
  public async generateShareablePdf(input: {
    payload: Omit<EmployeeSynthesisPayload, 'synthesis'> & {
      synthesis: Omit<EmployeeSynthesisPayload['synthesis'], 'expertNotesInternal'>
    }
  }): Promise<Uint8Array> {
    const { employee, synthesis } = input.payload
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 in points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const margin = 48
    let y = 841.89 - margin

    const drawTitle = (text: string) => {
      page.drawText(sanitizeToWinAnsi(text), {
        x: margin,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      })
      y -= 26
    }
    const drawLabel = (text: string) => {
      page.drawText(sanitizeToWinAnsi(text), {
        x: margin,
        y,
        size: 9,
        font: fontBold,
        color: rgb(0.4, 0.45, 0.55),
      })
      y -= 14
    }
    const drawBody = (text: string) => {
      const safe = (text || '').trim() || '—'
      const lines = safe.split('\n')
      for (const line of lines) {
        page.drawText(sanitizeToWinAnsi(line).slice(0, 120), {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.06, 0.09, 0.16),
        })
        y -= 14
      }
      y -= 8
    }

    drawTitle('Synthèse partagée')
    drawLabel('Identité')
    drawBody(
      `${employee.name}\n${employee.currentRole}${employee.targetRole ? ` → ${employee.targetRole}` : ''}`
    )

    if (synthesis.executiveSummaryOverride) {
      drawLabel('Résumé')
      drawBody(synthesis.executiveSummaryOverride)
    }

    drawLabel('Commentaires de l’expert')
    drawBody(synthesis.expertCommentsShared ?? 'Aucun commentaire partagé.')

    drawLabel('Résultats (types complétés)')
    const completedTypes = employee.exercises
      .filter((e) => Boolean(e.date))
      .map((e) => String(e.type))
    drawBody(completedTypes.length > 0 ? completedTypes.join(', ') : 'Aucun')

    // Footer
    page.drawText(sanitizeToWinAnsi('Document partageable — notes internes exclues'), {
      x: margin,
      y: margin - 10,
      size: 9,
      font,
      color: rgb(0.5, 0.55, 0.62),
    })

    const out = await pdfDoc.save()

    return out
  }
}
