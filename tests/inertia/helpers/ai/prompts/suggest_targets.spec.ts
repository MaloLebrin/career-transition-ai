import { describe, expect, test } from 'vitest'
import { buildSuggestTargetsPrompt } from '#shared/helpers/ai/prompts/suggest_targets'

describe('buildSuggestTargetsPrompt', () => {
  test('liste les compétences séparées par des virgules et le poste cible', () => {
    const prompt = buildSuggestTargetsPrompt({
      skills: ['SQL', 'Power BI', 'Gestion de projet'],
      targetRole: 'Data analyst',
    })
    expect(prompt).toContain('compétences: SQL, Power BI, Gestion de projet et ce poste cible')
    expect(prompt).toContain('poste cible: Data analyst,')
  })

  test('fixe le volume et le périmètre : 5 entreprises françaises réelles, 3 secteurs', () => {
    const prompt = buildSuggestTargetsPrompt({ skills: ['A'], targetRole: 'B' })
    expect(prompt).toContain('5 entreprises françaises (réelles)')
    expect(prompt).toContain('3 types de secteurs porteurs')
  })

  test('annonce les clés JSON lues par le use case (companies, sectors)', () => {
    const prompt = buildSuggestTargetsPrompt({ skills: [], targetRole: 'B' })
    expect(prompt).toContain('Réponds exclusivement en JSON')
    expect(prompt).toContain("'companies' (array de strings)")
    expect(prompt).toContain("'sectors' (array de strings)")
  })

  test('sans compétence, la liste est vide mais le poste cible reste présent', () => {
    const prompt = buildSuggestTargetsPrompt({ skills: [], targetRole: 'Paysagiste' })
    expect(prompt.startsWith('Basé sur ces compétences:  et ce poste cible: Paysagiste,')).toBe(
      true
    )
  })

  test('n’envoie que compétences et poste (aucun champ d’identité possible)', () => {
    const input = { skills: ['SQL'], targetRole: 'Dev', name: 'Marie', email: 'm@example.com' }
    const prompt = buildSuggestTargetsPrompt(input)
    expect(prompt).not.toContain('Marie')
    expect(prompt).not.toContain('m@example.com')
  })
})
