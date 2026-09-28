import { buildMotivationQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/motivation'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildMotivationQualitativePrompt', {
  builder: buildMotivationQualitativePrompt,
  section: '## Exercice: motivations (données)',
  task: 'Rédige une analyse courte et très actionnable, en FRANÇAIS, adaptée au profil.',
  headings: ['Synthèse', 'Lecture du profil', 'Conseil actionnable 7 jours'],
  exerciseData: {
    top: ['autonomie', 'apprentissage'],
    answers: { why: 'Hélène veut un métier plus analytique' },
  },
})
