import { buildSkillMappingQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/skill_mapping'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildSkillMappingQualitativePrompt', {
  builder: buildSkillMappingQualitativePrompt,
  section: '## Exercice: cartographie des compétences (données)',
  task: 'Résume la qualité des preuves/impacts et propose une amélioration immédiate.',
  headings: ['Synthèse', 'Points forts', 'À renforcer'],
  exerciseData: {
    skills: [
      { name: 'Reporting', proof: 'Hélène a automatisé 12 tableaux de bord', impact: '-2 j/mois' },
    ],
  },
})
