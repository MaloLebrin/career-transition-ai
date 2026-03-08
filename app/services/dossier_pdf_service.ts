import type Employee from '#models/employee'
import type ExerciseResult from '#models/exercise_result'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const MARGIN = 48
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const LINE_HEIGHT = 15
const TITLE_SIZE = 22
const SECTION_SIZE = 11
const BODY_SIZE = 10
const SMALL_SIZE = 9
const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN

const COLORS = {
  navy: rgb(0.12, 0.18, 0.25),
  sage: rgb(0.43, 0.56, 0.5),
  ivory: rgb(0.96, 0.95, 0.92),
  gray: rgb(0.42, 0.45, 0.5),
  lightGray: rgb(0.75, 0.76, 0.78),
} as const

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  motivation: 'Analyse Motivations',
  values: 'Recherche de Valeurs',
  personality: 'Personnalité',
  competencies: 'Compétences',
  life_curve: 'Courbe de vie',
  cv_analysis: 'Analyse CV',
  targeting: 'Ciblage',
  disc: 'DISC',
  circle_of_control: 'Cercle de contrôle',
  skill_mapping: 'Cartographie des compétences',
}

function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number): string[] {
  const lines: string[] = []
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    const w = font.widthOfTextAtSize(next, size)
    if (w > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function getSkills(employee: Employee): Array<{ name: string; level: number }> {
  return (employee.skills || []).map((s) => {
    const level =
      Number((s as unknown as { $extras?: { level?: number } }).$extras?.level) || 3
    const bounded = Number.isNaN(level) ? 3 : Math.min(5, Math.max(1, level))
    return { name: s.name, level: bounded }
  })
}

export async function generateProfilPdf(employee: Employee): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const ensureSpace = (needed: number) => {
    if (y < MARGIN + needed) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  const drawLine = (text: string, opts: { indent?: number; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    ensureSpace(LINE_HEIGHT)
    const size = opts.size ?? BODY_SIZE
    const color = opts.color ?? COLORS.navy
    page.drawText(text, {
      x: MARGIN + (opts.indent ?? 0),
      y,
      size,
      font,
      color,
      maxWidth: MAX_WIDTH - (opts.indent ?? 0),
    })
    y -= LINE_HEIGHT
  }

  const drawParagraph = (text: string) => {
    const lines = wrapText(text || '', MAX_WIDTH, font, BODY_SIZE)
    for (const line of lines) {
      drawLine(line)
    }
  }

  const drawSectionTitle = (text: string) => {
    ensureSpace(LINE_HEIGHT + 20)
    y -= 6
    page.drawRectangle({
      x: MARGIN,
      y: y - SECTION_SIZE - 2,
      width: 4,
      height: SECTION_SIZE + 6,
      color: COLORS.sage,
    })
    page.drawText(text, {
      x: MARGIN + 12,
      y: y - SECTION_SIZE,
      size: SECTION_SIZE,
      font: fontBold,
      color: COLORS.navy,
    })
    y -= SECTION_SIZE + 8
  }

  // Bandeau header
  const headerHeight = 72
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: COLORS.navy,
  })
  page.drawText('Profil candidat', {
    x: MARGIN,
    y: PAGE_HEIGHT - headerHeight + 28,
    size: SMALL_SIZE,
    font: fontBold,
    color: COLORS.ivory,
  })
  page.drawText(employee.name, {
    x: MARGIN,
    y: PAGE_HEIGHT - headerHeight + 10,
    size: TITLE_SIZE,
    font: fontBold,
    color: COLORS.ivory,
  })
  y = PAGE_HEIGHT - headerHeight - 24

  drawSectionTitle('Identité')
  drawLine(employee.name, { size: BODY_SIZE + 1 })
  drawLine(employee.email, { color: COLORS.gray })
  drawLine(`Poste actuel · ${employee.currentRole}`)
  if (employee.targetRole) drawLine(`Objectif · ${employee.targetRole}`)
  y -= 8

  if (employee.summary) {
    drawSectionTitle('Bref / Résumé')
    drawParagraph(employee.summary)
    y -= 8
  }

  const experiences = employee.experiences || []
  if (experiences.length > 0) {
    drawSectionTitle('Expériences')
    for (const e of experiences) {
      ensureSpace(LINE_HEIGHT * 3)
      const dates = e.endDate ? `${e.startDate} – ${e.endDate}` : e.startDate + (e.isCurrent ? ' – à ce jour' : '')
      drawLine(`${e.title}`, { indent: 0 })
      drawLine(`${e.company} · ${dates}`, { indent: 12, color: COLORS.gray, size: SMALL_SIZE })
      if (e.description) {
        drawParagraph(e.description)
        y -= 4
      }
      y -= 6
    }
    y -= 4
  }

  const educations = employee.educations || []
  if (educations.length > 0) {
    drawSectionTitle('Formations')
    for (const e of educations) {
      ensureSpace(LINE_HEIGHT * 3)
      const dates = e.endDate ? `${e.startDate} – ${e.endDate}` : e.startDate + (e.isCurrent ? ' – en cours' : '')
      drawLine(`${e.degree}`, { indent: 0 })
      drawLine(`${e.school} · ${dates}`, { indent: 12, color: COLORS.gray, size: SMALL_SIZE })
      if (e.description) {
        drawParagraph(e.description)
        y -= 4
      }
      y -= 6
    }
    y -= 4
  }

  const skills = getSkills(employee)
  if (skills.length > 0) {
    drawSectionTitle('Compétences')
    for (const s of skills) {
      drawLine(`${s.name}  —  ${s.level}/5`, { indent: 8 })
    }
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}

export async function generateResultPdf(result: ExerciseResult): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const title = EXERCISE_TYPE_LABELS[result.type] || result.type
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const ensureSpace = (needed: number) => {
    if (y < MARGIN + needed) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  const drawLine = (text: string, opts: { size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    ensureSpace(15)
    page.drawText(text, {
      x: MARGIN,
      y,
      size: opts.size ?? BODY_SIZE,
      font,
      color: opts.color ?? COLORS.navy,
      maxWidth: MAX_WIDTH,
    })
    y -= LINE_HEIGHT
  }

  // Header avec barre sage
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 56,
    width: PAGE_WIDTH,
    height: 5,
    color: COLORS.sage,
  })
  page.drawText(title, {
    x: MARGIN,
    y: PAGE_HEIGHT - 48,
    size: TITLE_SIZE,
    font: fontBold,
    color: COLORS.navy,
  })
  y = PAGE_HEIGHT - 72

  const meta: string[] = []
  if (result.date) meta.push(result.date)
  if (result.duration != null) meta.push(`${result.duration} min`)
  if (result.quantitativeScore != null) meta.push(`Score : ${result.quantitativeScore}`)
  if (meta.length) {
    drawLine(meta.join('  ·  '), { color: COLORS.gray, size: SMALL_SIZE })
    y -= 12
  }

  if (result.qualitativeAnalysis) {
    ensureSpace(20)
    page.drawRectangle({
      x: MARGIN,
      y: y - 14,
      width: 4,
      height: 14,
      color: COLORS.sage,
    })
    page.drawText('Analyse qualitative', {
      x: MARGIN + 10,
      y: y - 12,
      size: SECTION_SIZE,
      font: fontBold,
      color: COLORS.navy,
    })
    y -= 22
    const lines = wrapText(result.qualitativeAnalysis, MAX_WIDTH, font, BODY_SIZE)
    for (const line of lines) {
      drawLine(line)
    }
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
