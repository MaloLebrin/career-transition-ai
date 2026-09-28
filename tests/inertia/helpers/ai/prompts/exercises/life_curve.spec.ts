import { buildLifeCurveQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/life_curve'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildLifeCurveQualitativePrompt', {
  builder: buildLifeCurveQualitativePrompt,
  section: '## Exercice: courbe de vie (données)',
  task: 'Interprète les périodes hautes/basses et propose une lecture orientée projet pro.',
  headings: ['Périodes clés', 'Hypothèses', 'Décision à tester'],
  exerciseData: {
    points: [
      { year: 2015, score: 8, label: 'Premier poste de comptable' },
      { year: 2020, score: 3, label: 'Hélène vit un épuisement' },
    ],
  },
})
