import { test } from '@japa/runner'
import { isUrl } from '#shared/helpers/url'

test.group('isUrl', () => {
  test('reconnaît les URLs http et https', ({ assert }) => {
    assert.isTrue(isUrl('http://example.com'))
    assert.isTrue(isUrl('https://visio.example.com/salle'))
  })

  test('refuse un lieu physique ou un chemin relatif', ({ assert }) => {
    assert.isFalse(isUrl('12 rue de la Paix, Paris'))
    assert.isFalse(isUrl('/dashboard'))
    assert.isFalse(isUrl(''))
  })
})
