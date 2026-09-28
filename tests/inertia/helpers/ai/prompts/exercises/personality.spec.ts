import { buildPersonalityQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/personality'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildPersonalityQualitativePrompt', {
  builder: buildPersonalityQualitativePrompt,
  section: '## Exercice: personnalité (données)',
  task: 'Relie les traits/axes identifiés à des comportements observables au travail.',
  headings: ['Synthèse', 'Ce qui te réussit', 'Ce qui te coûte', 'Ajustement concret'],
  exerciseData: {
    axes: { extraversion: 35, conscientiousness: 88 },
    selfDescription: 'Dupont-Marchal, méthodique et discrète',
  },
})
