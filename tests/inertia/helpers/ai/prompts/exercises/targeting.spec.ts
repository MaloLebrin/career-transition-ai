import { buildTargetingQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/targeting'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildTargetingQualitativePrompt', {
  builder: buildTargetingQualitativePrompt,
  section: '## Exercice: ciblage (données)',
  task: 'Évalue la cohérence du ciblage avec le profil et propose des ajustements.',
  headings: ['Cohérence globale', 'Opportunités', 'Prochaines actions'],
  exerciseData: {
    targets: [{ job: 'Data analyst', sector: 'Banque', fit: 'high' }],
    constraints: 'Hélène reste à Lille',
  },
})
