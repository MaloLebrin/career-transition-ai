import { test } from '@japa/runner'
import { generateSlug } from '#utils/slug'

test.group('generateSlug', () => {
  test('lowercases the string', ({ assert }) => {
    assert.equal(generateSlug('My Company'), 'my-company')
  })

  test('replaces spaces with hyphens', ({ assert }) => {
    assert.equal(generateSlug('hello world'), 'hello-world')
    assert.equal(generateSlug('a  b   c'), 'a-b-c')
  })

  test('strips non-alphanumeric characters except hyphens', ({ assert }) => {
    assert.equal(generateSlug("L'Entreprise & Co."), 'lentreprise-co')
    assert.equal(generateSlug('Test@2024!'), 'test2024')
  })

  test('trims leading and trailing whitespace', ({ assert }) => {
    assert.equal(generateSlug('  foo bar  '), 'foo-bar')
  })

  test('returns empty string when only invalid characters', ({ assert }) => {
    assert.equal(generateSlug('   ??? ***   '), '')
  })

  test('handles already slug-like string', ({ assert }) => {
    assert.equal(generateSlug('already-slug'), 'already-slug')
  })
})
