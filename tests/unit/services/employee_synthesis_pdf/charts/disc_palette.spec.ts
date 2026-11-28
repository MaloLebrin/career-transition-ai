import { DISC_COLORS } from '#services/employee_synthesis_pdf/charts/disc_palette'
import { DISC_TRAIT_PALETTE, DISC_WHEEL_TRAITS } from '#shared/constants/disc_wheel'
import { test } from '@japa/runner'

test.group('employee_synthesis_pdf/charts/disc_palette', () => {
  test('une couleur par trait, reprise de la palette de la charte', ({ assert }) => {
    assert.sameMembers(Object.keys(DISC_COLORS), [...DISC_WHEEL_TRAITS])
    DISC_WHEEL_TRAITS.forEach((trait) => {
      assert.equal(DISC_COLORS[trait].bar, DISC_TRAIT_PALETTE[trait].boldHex)
      assert.equal(DISC_COLORS[trait].bg, DISC_TRAIT_PALETTE[trait].softHex)
      assert.equal(DISC_COLORS[trait].ink, DISC_TRAIT_PALETTE[trait].inkHex)
    })
  })

  test('libellés des traits en clair', ({ assert }) => {
    assert.equal(DISC_COLORS.D.label, 'Dominant')
    assert.equal(DISC_COLORS.C.label, 'Consciencieux')
  })
})
