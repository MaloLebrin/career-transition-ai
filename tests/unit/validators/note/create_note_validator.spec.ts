import { test } from '@japa/runner'
import { createNoteValidator } from '#validators/note/create_note_validator'

test.group('createNoteValidator', () => {
  test('accepte une note privée minimale', async ({ assert }) => {
    const result = await createNoteValidator.validate({
      content: '  Bon échange ',
      visibility: 'private',
    })
    assert.deepEqual(result, { content: 'Bon échange', visibility: 'private' })
  })

  test('accepte une note partagée rattachée à une étape et un exercice', async ({ assert }) => {
    const result = await createNoteValidator.validate({
      content: 'À revoir',
      visibility: 'shared',
      supportPlanStepId: 4,
      exerciseResultId: 9,
    })
    assert.equal(result.supportPlanStepId, 4)
    assert.equal(result.exerciseResultId, 9)
  })

  test('rejette un contenu vide', async ({ assert }) => {
    await assert.rejects(() =>
      createNoteValidator.validate({ content: '   ', visibility: 'private' })
    )
  })

  test('rejette une visibilité inconnue', async ({ assert }) => {
    await assert.rejects(() =>
      createNoteValidator.validate({ content: 'Note', visibility: 'public' as any })
    )
  })

  test('rejette des identifiants de rattachement non positifs', async ({ assert }) => {
    await assert.rejects(() =>
      createNoteValidator.validate({ content: 'Note', visibility: 'shared', supportPlanStepId: 0 })
    )
    await assert.rejects(() =>
      createNoteValidator.validate({ content: 'Note', visibility: 'shared', exerciseResultId: -1 })
    )
  })
})
