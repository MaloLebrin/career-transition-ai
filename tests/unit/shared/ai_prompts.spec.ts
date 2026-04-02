import { buildAnalyzeExercisePrompt } from '#shared/helpers/ai/prompts/analyze_exercise'
import { test } from '@japa/runner'

test.group('shared/helpers/ai prompts', () => {
  test('buildAnalyzeExercisePrompt includes type and json data', ({ assert }) => {
    const prompt = buildAnalyzeExercisePrompt('values', { hello: 'world' })
    assert.include(prompt, 'values')
    assert.include(prompt, '"hello":"world"')
  })
})

