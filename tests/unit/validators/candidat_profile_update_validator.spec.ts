import { test } from '@japa/runner'
import { candidatProfileUpdateValidator } from '#validators/profile/candidat_profile_update_validator'

test.group('candidatProfileUpdateValidator', () => {
  test('accepts empty payload', async ({ assert }) => {
    const result = await candidatProfileUpdateValidator.validate({})
    assert.deepEqual(result, {})
  })

  test('accepts basic profile fields', async ({ assert }) => {
    const result = await candidatProfileUpdateValidator.validate({
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      currentRole: 'Développeur',
      targetRole: 'Lead',
      summary: 'Résumé',
      onboarded: true,
    })

    assert.equal(result.name, 'Jean Dupont')
    assert.equal(result.email, 'jean.dupont@example.com')
    assert.equal(result.currentRole, 'Développeur')
    assert.equal(result.targetRole, 'Lead')
    assert.equal(result.summary, 'Résumé')
    assert.isTrue(result.onboarded)
  })

  test('accepts onboarding arrays (lenient strings)', async ({ assert }) => {
    const result = await candidatProfileUpdateValidator.validate({
      experiences: [
        {
          title: 'Dev',
          company: 'ACME',
          type: 'CDI',
          startDate: '2024-01',
          endDate: '2025-02-01',
          isCurrent: false,
          description: 'Missions',
        },
      ],
      educations: [
        {
          degree: 'Master',
          school: 'Uni',
          startDate: '2018-09-01',
          endDate: null,
          isCurrent: true,
          description: '',
        },
      ],
      skills: [{ name: 'TypeScript', level: 4 }],
    })

    assert.lengthOf(result.experiences!, 1)
    assert.lengthOf(result.educations!, 1)
    assert.lengthOf(result.skills!, 1)
    assert.equal(result.skills![0].name, 'TypeScript')
    assert.equal(result.skills![0].level, 4)
  })

  test('rejects invalid email', async ({ assert }) => {
    await assert.rejects(() =>
      candidatProfileUpdateValidator.validate({
        email: 'not-an-email',
      } as any)
    )
  })
})

