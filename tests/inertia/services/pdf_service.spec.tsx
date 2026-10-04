import { beforeEach, describe, expect, test, vi } from 'vitest'

import { generateComprehensivePDF } from '~/services/pdf_service'
import type { Employee } from '~/types/employee'

const pdfMock = vi.hoisted(() => {
  const instances: any[] = []
  class FakeJsPDF {
    options: unknown
    internal = {
      // Comme jsPDF : l'index 0 est inutilisé, un document neuf contient déjà 1 page
      pages: [null, []] as unknown[],
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
    }
    addPage = vi.fn(() => {
      this.internal.pages.push([])
    })
    addImage = vi.fn()
    save = vi.fn()
    constructor(options: unknown) {
      this.options = options
      instances.push(this)
    }
  }
  const captured: HTMLElement[] = []
  const html2canvas = vi.fn(async (element: HTMLElement) => {
    captured.push(element.cloneNode(true) as HTMLElement)
    return { toDataURL: () => 'data:image/jpeg;base64,AAA' }
  })
  return { FakeJsPDF, instances, html2canvas, captured }
})

vi.mock('jspdf', () => ({ jsPDF: pdfMock.FakeJsPDF }))
vi.mock('html2canvas', () => ({ default: pdfMock.html2canvas }))

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    organizationId: 1,
    name: 'Camille  Martin',
    email: 'camille@example.com',
    currentRole: 'Comptable',
    targetRole: 'Data analyst',
    advisorNotes: 'Très motivée',
    skills: [
      { name: 'Excel', level: 5 },
      { name: 'SQL', level: 4 },
      { name: 'Python', level: 2 },
    ],
    experiences: [],
    educations: [],
    status: 'active',
    onboarded: true,
    exercises: [],
    plan: [],
    ...overrides,
  } as Employee
}

const exercise = (type: string, data: unknown, extra: Record<string, unknown> = {}) =>
  ({ id: 1, type, data, date: '2024-05-01', qualitativeAnalysis: 'Analyse IA', ...extra }) as never

describe('generateComprehensivePDF', () => {
  beforeEach(() => {
    pdfMock.instances.length = 0
    pdfMock.captured.length = 0
    pdfMock.html2canvas.mockClear()
    vi.mocked(alert).mockClear()
  })

  test('sans exercice : couverture, systémie et synthèse puis sauvegarde nommée d’après l’accompagné', async () => {
    await generateComprehensivePDF(makeEmployee())

    const pdf = pdfMock.instances[0]
    expect(pdf.options).toEqual({ orientation: 'p', unit: 'mm', format: 'a4' })
    expect(pdfMock.html2canvas).toHaveBeenCalledTimes(3)
    expect(pdf.addImage).toHaveBeenCalledTimes(3)
    expect(pdf.addImage).toHaveBeenCalledWith('data:image/jpeg;base64,AAA', 'JPEG', 0, 0, 210, 297)
    expect(pdf.save).toHaveBeenCalledWith('Rapport_Transition_Camille_Martin.pdf')

    const [cover, systemic, summary] = pdfMock.captured
    expect(cover.textContent).toContain('Camille  Martin')
    // Compétences de niveau >= 4 uniquement ; valeurs et motivations non définies
    expect(systemic.textContent).toContain('Excel, SQL')
    expect(systemic.textContent).not.toContain('Python')
    expect(systemic.textContent).toContain('Non défini')
    expect(systemic.textContent).toContain('Analyse en cours')
    expect(summary.textContent).toContain('Très motivée')
    expect(summary.textContent).toContain('Data analyst')
    expect(summary.textContent).toMatch(/Python\s+2\/5/)

    // Le conteneur de rendu hors écran est retiré du DOM
    expect(document.body.children).toHaveLength(0)
  })

  test('valeurs par défaut sans notes, cible ni compétence avancée', async () => {
    await generateComprehensivePDF(
      makeEmployee({
        advisorNotes: undefined,
        targetRole: undefined,
        skills: [{ name: 'Word', level: 1 }],
      })
    )
    const [, systemic, summary] = pdfMock.captured
    expect(systemic.textContent).toContain('En cours')
    expect(summary.textContent).toContain('Aucune note saisie.')
    expect(summary.textContent).toContain('Non définie')
  })

  test('ajoute une page détaillée par exercice (motivations, valeurs, DISC, autre)', async () => {
    const ranked = Array.from({ length: 22 }, (_, i) => `Motivation ${i + 1}`)
    await generateComprehensivePDF(
      makeEmployee({
        exercises: [
          exercise('motivation', { ranked }),
          exercise('values', {
            selectedValues: ['La bienveillance', "L'autonomie", 'Le pouvoir', 'La tradition'],
          }),
          exercise('disc', { D: 20, I: 70, S: 40, C: 10 }),
          exercise('life_curve', { points: [] }, { date: '2024-06-01' }),
        ],
      })
    )

    const pdf = pdfMock.instances[0]
    expect(pdf.addImage).toHaveBeenCalledTimes(7)

    const [, systemic, , motivation, values, disc, other] = pdfMock.captured
    expect(systemic.textContent).toContain('Motivation 1, Motivation 2, Motivation 3')
    expect(systemic.textContent).toContain("La bienveillance, L'autonomie, Le pouvoir")
    expect(systemic.textContent).toContain('Profil dominant : IS')

    expect(motivation.textContent).toContain('Analyse Motivations')
    expect(motivation.textContent).toContain('Motivation 22')
    expect(motivation.textContent).toContain('PAGE 04')
    expect(values.textContent).toContain('Analyse Valeurs')
    expect(values.textContent).toContain('La tradition')
    expect(disc.textContent).toContain('Analyse DISC')
    for (const label of ['Dominance', 'Influence', 'Stabilité', 'Conformité']) {
      expect(disc.textContent).toContain(label)
    }
    expect(other.textContent).not.toContain('Analyse DISC')
    expect(other.textContent).toContain('2024-06-01')
    expect(other.textContent).toContain('Analyse IA')
    expect(other.textContent).toContain('PAGE 07')
  })

  test('en cas d’échec de capture : alerte, journalisation et nettoyage du DOM', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    pdfMock.html2canvas.mockRejectedValueOnce(new Error('canvas KO'))

    await generateComprehensivePDF(makeEmployee())

    expect(consoleError).toHaveBeenCalledWith('PDF Export failed:', expect.any(Error))
    expect(alert).toHaveBeenCalledWith('Erreur export PDF.')
    expect(pdfMock.instances[0].save).not.toHaveBeenCalled()
    expect(document.body.children).toHaveLength(0)
    consoleError.mockRestore()
  })
})
