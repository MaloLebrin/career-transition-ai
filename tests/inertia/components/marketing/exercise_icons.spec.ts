import { describe, expect, test } from 'vitest'
import { Target } from 'lucide-react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import {
  EXERCISE_ICONS,
  exerciseIcon,
} from '../../../../inertia/components/marketing/exercise_icons'

describe('exercise_icons', () => {
  test('every exercise of the catalogue has an icon, unknown ones fall back', () => {
    for (const exercise of EXERCISE_LIST) expect(EXERCISE_ICONS[exercise.slug]).toBeDefined()
    expect(exerciseIcon('inconnu')).toBe(Target)
  })
})
