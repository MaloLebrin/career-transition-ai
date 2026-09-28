import { buildDiscQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/disc'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildDiscQualitativePrompt', {
  builder: buildDiscQualitativePrompt,
  section: '## Exercice: DISC (données)',
  task: 'Interprète le profil DISC et relie-le au contexte professionnel du candidat.',
  headings: ['Synthèse', 'Forces', 'Risques/angles morts', 'Environnement idéal'],
  exerciseData: {
    scores: { D: 12, I: 6, S: 9, C: 15 },
    dominant: 'C',
    comment: 'Selon Hélène, le style C lui correspond',
  },
})
