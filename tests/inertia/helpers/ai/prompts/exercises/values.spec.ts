import { buildValuesQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/values'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildValuesQualitativePrompt', {
  builder: buildValuesQualitativePrompt,
  section: '## Exercice: valeurs (données)',
  task: 'Analyse les valeurs identifiées et traduis-les en recommandations concrètes.',
  headings: ['Valeurs clés', 'Points de tension potentiels', 'Recommandations de ciblage'],
  exerciseData: {
    ranked: ['utilité', 'équilibre', 'reconnaissance'],
    comment: 'Contact helene.dupont@example.com pour le suivi',
  },
})
