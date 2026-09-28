import { describe, expect, test } from 'vitest'
import { buildChallengeProofPrompt } from '#shared/helpers/ai/prompts/challenge_proof'

describe('buildChallengeProofPrompt', () => {
  test('cite l’activité et la preuve actuelle entre guillemets', () => {
    const prompt = buildChallengeProofPrompt('Gestion de la paie', 'Environ 200 salariés')
    expect(prompt).toContain('décrit son activité : "Gestion de la paie"')
    expect(prompt).toContain('Sa preuve actuelle est : "Environ 200 salariés"')
  })

  test('demande une seule question courte orientée chiffre ou fait', () => {
    const prompt = buildChallengeProofPrompt('a', 'b')
    expect(prompt).toContain('une SEULE question')
    expect(prompt).toContain('max 15 mots')
    expect(prompt).toMatch(/chiffre ou un fait précis/)
    expect(prompt).toMatch(/volume, budget, impact, outil/)
  })

  test('accepte une preuve vide (le modèle doit alors la faire émerger)', () => {
    const prompt = buildChallengeProofPrompt('Animation d’équipe', '')
    expect(prompt).toContain('Sa preuve actuelle est : "".')
  })

  test('ne demande pas de JSON : la réponse est du texte libre', () => {
    expect(buildChallengeProofPrompt('a', 'b')).not.toMatch(/JSON/i)
  })

  test('est déterministe', () => {
    expect(buildChallengeProofPrompt('x', 'y')).toBe(buildChallengeProofPrompt('x', 'y'))
  })
})
