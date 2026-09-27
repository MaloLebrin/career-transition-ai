import { test } from '@japa/runner'
import { buildChallengeProofPrompt } from '#shared/helpers/ai/prompts/challenge_proof'
import { buildExtractCvFromMarkdownPrompt } from '#shared/helpers/ai/prompts/extract_cv_from_markdown'
import { buildExtractSkillMappingPrompt } from '#shared/helpers/ai/prompts/extract_skill_mapping'
import { buildSuggestSkillMappingPrompt } from '#shared/helpers/ai/prompts/suggest_skill_mapping'
import { buildSuggestTargetsPrompt } from '#shared/helpers/ai/prompts/suggest_targets'

test.group('shared/helpers/ai/prompts', () => {
  test("buildChallengeProofPrompt cite l'activité et la preuve", ({ assert }) => {
    const prompt = buildChallengeProofPrompt('Former des équipes', '3 sessions')
    assert.include(prompt, '"Former des équipes"')
    assert.include(prompt, '"3 sessions"')
    assert.include(prompt, 'SEULE question')
  })

  test('buildExtractCvFromMarkdownPrompt inclut le schéma JSON et le CV', ({ assert }) => {
    const prompt = buildExtractCvFromMarkdownPrompt('# Marie Martin\nDéveloppeuse')
    assert.include(prompt, '"suggestedTargetRole"')
    assert.include(prompt, '"experiences"')
    assert.isTrue(prompt.endsWith('# Marie Martin\nDéveloppeuse'))
  })

  test('buildExtractCvFromMarkdownPrompt tronque le CV à 120 000 caractères', ({ assert }) => {
    const markdown = 'a'.repeat(120_000) + 'FIN'
    const prompt = buildExtractCvFromMarkdownPrompt(markdown)
    assert.notInclude(prompt, 'FIN')
    assert.include(prompt, 'a'.repeat(120_000))
  })

  test('buildExtractSkillMappingPrompt cite le récit et la structure attendue', ({ assert }) => {
    const prompt = buildExtractSkillMappingPrompt("J'ai piloté la migration")
    assert.include(prompt, `"J'ai piloté la migration"`)
    assert.include(prompt, '"mapping"')
    assert.include(prompt, 'proof')
  })

  test('buildSuggestSkillMappingPrompt cite le poste visé', ({ assert }) => {
    const prompt = buildSuggestSkillMappingPrompt('Data analyst')
    assert.include(prompt, '"Data analyst"')
    assert.include(prompt, '"activities"')
  })

  test('buildSuggestTargetsPrompt liste les compétences et le poste cible', ({ assert }) => {
    const prompt = buildSuggestTargetsPrompt({ skills: ['SQL', 'Python'], targetRole: 'Data' })
    assert.include(prompt, 'SQL, Python')
    assert.include(prompt, 'poste cible: Data')
    assert.include(prompt, "'companies'")
    assert.include(prompt, "'sectors'")
  })
})
