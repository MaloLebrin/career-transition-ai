import { buildCircleOfControlQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/circle_of_control'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildCircleOfControlQualitativePrompt', {
  builder: buildCircleOfControlQualitativePrompt,
  section: '## Exercice: cercle de contrôle (données)',
  task: 'ce que la personne contrôle vs influence vs subit, puis un plan simple',
  headings: ['Lecture', 'Levier principal', 'Plan 7 jours'],
  exerciseData: {
    control: ['Ma formation SQL du soir'],
    influence: ['Le budget formation négocié par Hélène avec son manager'],
    outside: ['Le marché de l’emploi en data'],
  },
})
