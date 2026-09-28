import { buildCompetenciesQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/competencies'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildCompetenciesQualitativePrompt', {
  builder: buildCompetenciesQualitativePrompt,
  section: '## Exercice: compétences (données)',
  task: 'compétences saillantes et de leur transférabilité vers la cible',
  headings: ['Compétences fortes', 'Compétences à développer', 'Transfert vers la cible'],
  exerciseData: {
    strengths: ['Rigueur', 'Analyse financière'],
    toDevelop: ['Python'],
    note: 'Hélène Dupont-Marchal se sent à l’aise en tableaux croisés',
  },
})
