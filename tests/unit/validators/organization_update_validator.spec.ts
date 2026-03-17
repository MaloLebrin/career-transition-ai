import { test } from '@japa/runner'
import { updateOrganizationValidator } from '#validators/organization/organization_update_validator'

test.group('updateOrganizationValidator', () => {
  test('accepts valid optional payload', async ({ assert }) => {
    const data = { name: 'New Name', slug: 'new-slug' }
    const result = await updateOrganizationValidator.validate(data)
    assert.equal(result.name, 'New Name')
    assert.equal(result.slug, 'new-slug')
  })

  test('rejects empty name when provided', async ({ assert }) => {
    const data = { name: '' }
    await assert.rejects(() => updateOrganizationValidator.validate(data))
  })
})
