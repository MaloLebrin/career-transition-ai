import { buildCvAnalysisQualitativePrompt } from '#shared/helpers/ai/prompts/exercises/cv_analysis'
import { describeQualitativePrompt } from './prompt_contract.js'

describeQualitativePrompt('buildCvAnalysisQualitativePrompt', {
  builder: buildCvAnalysisQualitativePrompt,
  section: '## Exercice: analyse CV (données)',
  task: 'cohérence du CV avec la cible et les améliorations prioritaires',
  persona: 'Tu es un coach carrière expert (bilan de compétences) avec expertise CV.',
  headings: ['Points forts', 'Manques / flous', 'Top 3 améliorations'],
  exerciseData: {
    header: 'Hélène DUPONT-MARCHAL — helene.dupont@example.com',
    sections: ['Expérience', 'Formation'],
    score: 62,
  },
})
