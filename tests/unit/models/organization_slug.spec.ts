import { test } from '@japa/runner'
import Organization from '#models/organization'

test.group('Organization slug hook', (group) => {
  group.each.setup(async () => {
    await Organization.query()
      .where('name', 'My Company')
      .orWhere('slug', 'like', 'my-company%')
      .orWhere('slug', 'custom-slug')
      .delete()
  })

  test('generates slug from name when creating', async ({ assert }) => {
    const org = await Organization.create({ name: 'My Company', logoUrl: null })

    assert.equal(org.slug, 'my-company')
  })

  test('ensures slug uniqueness by suffixing', async ({ assert }) => {
    const first = await Organization.create({ name: 'My Company', logoUrl: null })
    const second = await Organization.create({ name: 'My Company', logoUrl: null })

    assert.equal(first.slug, 'my-company')
    assert.notEqual(second.slug, first.slug)
    assert.isTrue(second.slug.startsWith('my-company-'))
  })

  test('does not override explicit slug', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Custom Org',
      slug: 'custom-slug',
      logoUrl: null,
    })

    assert.equal(org.slug, 'custom-slug')
  })
})
