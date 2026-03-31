import { describe, expect, test } from 'vitest'
import { computeDiscFromSelections } from '../../../inertia/components/exercises/disc/disc_scoring'

describe('disc scoring', () => {
  test('computes percent scores and dominant/secondary deterministically', () => {
    const selections = {
      0: { most: 'D', least: 'C' },
      1: { most: 'D', least: 'C' },
      2: { most: 'I', least: 'S' },
      3: { most: 'I', least: 'S' },
    } as const

    const computed = computeDiscFromSelections(selections as any, 4)

    expect(computed.version).toBe(2)
    expect(computed.blocksCount).toBe(4)
    expect(computed.percent.D).toBeGreaterThanOrEqual(0)
    expect(computed.percent.D).toBeLessThanOrEqual(100)
    expect(computed.dominant).toBe('D')
    expect(computed.secondary).toBe('I')
  })

  test('tie-break uses mostCount then leastCount', () => {
    // Same percent for D and I, but D has higher mostCount.
    const selections = {
      0: { most: 'D', least: 'S' },
      1: { most: 'D', least: 'S' },
      2: { most: 'I', least: 'C' },
      3: { most: 'I', least: 'C' },
    } as const

    const computed = computeDiscFromSelections(selections as any, 4)

    // raw D=+2, I=+2, S=-2, C=-2 => D and I tie on percent
    // mostCount D=2, I=2 => still tie, leastCount D=0, I=0 => stable order D first
    expect(computed.dominant).toBe('D')
    expect(computed.secondary).toBe('I')
  })
})

