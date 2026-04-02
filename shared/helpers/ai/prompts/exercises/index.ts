import { EXERCICE_RESULTS_TYPES, type ExerciceResultType } from '#shared/constants/exercises'
import type { EmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'
import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'
import { buildCircleOfControlQualitativePrompt } from './circle_of_control.js'
import { buildCompetenciesQualitativePrompt } from './competencies.js'
import { buildCvAnalysisQualitativePrompt } from './cv_analysis.js'
import { buildDiscQualitativePrompt } from './disc.js'
import { buildLifeCurveQualitativePrompt } from './life_curve.js'
import { buildMotivationQualitativePrompt } from './motivation.js'
import { buildPersonalityQualitativePrompt } from './personality.js'
import { buildSkillMappingQualitativePrompt } from './skill_mapping.js'
import { buildTargetingQualitativePrompt } from './targeting.js'
import { buildValuesQualitativePrompt } from './values.js'

export function buildQualitativePromptForExerciseType(
  type: ExerciceResultType,
  input: { profile: EmployeeAiProfile; exerciseData: unknown }
): string {
  switch (type) {
    case EXERCICE_RESULTS_TYPES.MOTIVATION:
      return buildMotivationQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.VALUES:
      return buildValuesQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.DISC:
      return buildDiscQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.TARGETING:
      return buildTargetingQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.SKILL_MAPPING:
      return buildSkillMappingQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL:
      return buildCircleOfControlQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.LIFE_CURVE:
      return buildLifeCurveQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.PERSONALITY:
      return buildPersonalityQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.COMPETENCIES:
      return buildCompetenciesQualitativePrompt(input)
    case EXERCICE_RESULTS_TYPES.CV_ANALYSIS:
      return buildCvAnalysisQualitativePrompt(input)
    // Fallback: conserver un prompt générique
    default:
      return buildAnalyzeExercisePrompt(type, input.exerciseData)
  }
}

