import { test } from '@japa/runner'
import { updateEmployeeValidator } from '#validators/employee/employee_update_validator'

test.group('updateEmployeeValidator', () => {
  test('accepts empty object (all optional)', async ({ assert }) => {
    const result = await updateEmployeeValidator.validate({})
    assert.deepEqual(result, {})
  })

  test('accepts advisorNotes only', async ({ assert }) => {
    const payload = { advisorNotes: "Notes d'accompagnement." }
    const result = await updateEmployeeValidator.validate(payload)
    assert.equal(result.advisorNotes, payload.advisorNotes)
  })

  test('accepts valid status enum', async ({ assert }) => {
    const payload = { status: 'active' as const }
    const result = await updateEmployeeValidator.validate(payload)
    assert.equal(result.status, 'active')
  })

  test('accepts multiple optional fields', async ({ assert }) => {
    const payload = {
      advisorNotes: 'Notes',
      name: 'Nouveau Nom',
      currentRole: 'Lead',
      targetRole: 'Manager',
      summary: 'Résumé',
      onboarded: true,
    }
    const result = await updateEmployeeValidator.validate(payload)
    assert.equal(result.advisorNotes, payload.advisorNotes)
    assert.equal(result.name, payload.name)
    assert.equal(result.currentRole, payload.currentRole)
    assert.equal(result.targetRole, payload.targetRole)
    assert.equal(result.summary, payload.summary)
    assert.isTrue(result.onboarded)
  })

  test('rejects invalid status', async ({ assert }) => {
    const payload = { status: 'invalid-status' }
    await assert.rejects(() => updateEmployeeValidator.validate(payload as any))
  })

  test('rejects non-boolean onboarded', async ({ assert }) => {
    const payload = { onboarded: 'yes' }
    await assert.rejects(() => updateEmployeeValidator.validate(payload as any))
  })
})
