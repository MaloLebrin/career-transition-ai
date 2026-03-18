import { EXERCICE_RESULTS_TYPES } from '../../../shared/constants/exercises'
import { ExerciseResult } from '../../types'
import MotivationResultView from './MotivationResultView'
import {
  CircleOfControlResultView,
  DefaultResultView,
  DiscResultView,
  LifeCurveResultView,
  SkillMappingResultView,
  TargetingResultView,
} from './results'

interface Props {
  result: ExerciseResult
}

export default function ExerciseResultVisualization({ result }: Props) {
  const data = result.data ?? {}
  const resultType = (result.type ?? '').toLowerCase().replace(/-/g, '_')

  switch (resultType) {
    case EXERCICE_RESULTS_TYPES.SKILL_MAPPING: {
      const mapping = Array.isArray(data.mapping) ? data.mapping : []
      return <SkillMappingResultView jobTitle={data.jobTitle ?? '—'} mapping={mapping} />
    }

    case EXERCICE_RESULTS_TYPES.MOTIVATION: {
      const motivationData = {
        ranked: Array.isArray(data.ranked) ? data.ranked : [],
        scores: data.scores && typeof data.scores === 'object' ? data.scores : {},
        matrix: Array.isArray(data.matrix) ? data.matrix : [],
      }
      return (
        <MotivationResultView
          data={motivationData}
          date={result.date}
          duration={result.duration}
        />
      )
    }

    case EXERCICE_RESULTS_TYPES.LIFE_CURVE: {
      const points = Array.isArray(data.points) ? data.points : []
      const reflection =
        data.reflection && typeof data.reflection === 'object' ? data.reflection : {}
      return <LifeCurveResultView points={points} reflection={reflection} />
    }

    case EXERCICE_RESULTS_TYPES.DISC: {
      return (
        <DiscResultView
          scores={{
            D: Number(data.D) || 0,
            I: Number(data.I) || 0,
            S: Number(data.S) || 0,
            C: Number(data.C) || 0,
          }}
        />
      )
    }

    case EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL: {
      const inControl = Array.isArray(data.inControl) ? data.inControl : []
      const outControl = Array.isArray(data.outControl) ? data.outControl : []
      return <CircleOfControlResultView inControl={inControl} outControl={outControl} />
    }

    case EXERCICE_RESULTS_TYPES.TARGETING: {
      const targets = Array.isArray(data.targets) ? data.targets : []
      return <TargetingResultView targets={targets} />
    }

    default:
      return <DefaultResultView data={data} />
  }
}
