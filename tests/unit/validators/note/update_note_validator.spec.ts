import { test } from '@japa/runner'
import { updateNoteValidator } from '#validators/note/update_note_validator'

test.group('updateNoteValidator', () => {
  test('accepte un objet vide (tous les champs optionnels)', async ({ assert }) => {
    assert.deepEqual(await updateNoteValidator.validate({}), {})
  })

  test('accepte un contenu et une visibilité', async ({ assert }) => {
    const result = await updateNoteValidator.validate({ content: ' Maj ', visibility: 'shared' })
    assert.deepEqual(result, { content: 'Maj', visibility: 'shared' })
  })

  test('rejette un contenu vide si fourni', async ({ assert }) => {
    await assert.rejects(() => updateNoteValidator.validate({ content: '' }))
  })

  test('rejette une visibilité inconnue', async ({ assert }) => {
    await assert.rejects(() => updateNoteValidator.validate({ visibility: 'team' as any }))
  })
})
