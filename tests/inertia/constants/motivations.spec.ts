import { describe, expect, test } from 'vitest'
import {
  MOTIVATIONS,
  MOTIVATIONS_LIST,
  motivationDefinition,
} from '../../../inertia/constants/motivations'

// Libellés enregistrés dans les résultats : l'ordre sert d'index à la matrice.
const HISTORICAL_LABELS = [
  'La rémunération',
  'La qualité de vie',
  'Le développement personnel',
  'Les conditions de travail',
  'Le statut social',
  "La pérennité de l'entreprise",
  'La reconnaissance',
  "La possibilité d'évoluer professionnellement",
  'La possibilité de développer une expertise',
  'La prise de responsabilités',
  "L'autonomie",
  'Le contenu du poste',
  "Le sentiment d'accomplissement",
  'La satisfaction de transmettre des connaissances',
  'Le partage des valeurs',
  'Atteindre des objectifs ambitieux',
  'Développer de nouvelles compétences',
  'La complexité des tâches à réaliser',
  'La hauteur des enjeux stratégiques',
  "S'exposer, prendre des risques",
  "Le sentiment d'utilité sociale",
  'Prendre des décisions',
]

describe('inertia/constants/motivations', () => {
  test('22 motivations, libellés et ordre historiques inchangés', () => {
    expect(MOTIVATIONS_LIST).toEqual(HISTORICAL_LABELS)
    expect(MOTIVATIONS.map((m) => m.label)).toEqual(HISTORICAL_LABELS)
  })

  test('chaque motivation a une définition courte', () => {
    for (const { label, definition } of MOTIVATIONS) {
      expect(definition.trim().length, label).toBeGreaterThan(10)
      expect(definition.length, label).toBeLessThanOrEqual(120)
    }
  })

  test('motivationDefinition retrouve la définition par libellé', () => {
    expect(motivationDefinition('La rémunération')).toBe(MOTIVATIONS[0].definition)
    expect(motivationDefinition('Inconnue')).toBeUndefined()
  })
})
