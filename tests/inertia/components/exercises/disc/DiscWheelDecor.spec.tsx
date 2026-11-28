import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import {
  DISC_WHEEL_RING_RADII,
  DISC_WHEEL_VIEW,
  DiscWheelGradients,
  DiscWheelTraitPills,
  DiscWheelZoneLabels,
} from '../../../../../inertia/components/exercises/disc/DiscWheelDecor'

function renderInSvg(node: React.ReactNode) {
  return render(<svg>{node}</svg>)
}

describe('DiscWheelDecor', () => {
  test('les rayons des anneaux vont du disque central au bord de la roue', () => {
    expect(DISC_WHEEL_RING_RADII).toHaveLength(4)
    expect(DISC_WHEEL_RING_RADII.at(-1)).toBe(DISC_WHEEL_VIEW.radius)
    expect([...DISC_WHEEL_RING_RADII].sort((a, b) => a - b)).toEqual(DISC_WHEEL_RING_RADII)
  })

  test('un dégradé par zone mixte, préfixé par instance', () => {
    const { container } = renderInSvg(<DiscWheelGradients prefix="roue-1" />)
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
    expect(ids).toEqual([
      'roue-1-organisant',
      'roue-1-promoteur',
      'roue-1-facilitant',
      'roue-1-coordonnant',
    ])
  })

  test('huit libellés de zone, celui du candidat en accent', () => {
    const { container } = renderInSvg(<DiscWheelZoneLabels candidateZoneKey="expansif" />)
    const labels = [...container.querySelectorAll('text')]
    expect(labels).toHaveLength(8)
    const accented = labels.filter((label) => label.classList.contains('fill-accent'))
    expect(accented.map((label) => label.textContent)).toEqual(['Expansif'])
  })

  test('quatre pastilles de traits, décoratives', () => {
    const { container } = renderInSvg(<DiscWheelTraitPills />)
    const pills = [...container.querySelectorAll('[data-trait-pill]')]
    expect(pills.map((pill) => pill.textContent)).toEqual(['D', 'I', 'S', 'C'])
    pills.forEach((pill) => expect(pill).toHaveAttribute('aria-hidden', 'true'))
  })
})
