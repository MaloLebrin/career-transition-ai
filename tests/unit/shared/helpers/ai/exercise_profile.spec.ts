import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { buildEmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

/**
 * `buildEmployeeAiProfile` ne lit que des propriétés : un littéral suffit, sans
 * base de données.
 */
function profileOf(employee: Record<string, unknown>) {
  return buildEmployeeAiProfile(employee as any)
}

test.group('buildEmployeeAiProfile', () => {
  test('construit le profil à partir des relations préchargées', ({ assert }) => {
    const profile = profileOf({
      name: 'Marie',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      skills: [{ name: 'React', $extras: { pivot_level: 4 } }],
      experiences: [
        {
          title: 'Dev',
          company: 'ACME',
          type: 'cdi',
          startDate: DateTime.fromISO('2020-01-15'),
          endDate: null,
          isCurrent: true,
          description: 'Front',
        },
      ],
      educations: [
        {
          degree: 'Master',
          school: 'Université',
          startDate: '2015-09-01',
          endDate: new Date('2017-06-30T12:00:00.000Z'),
          isCurrent: false,
          description: null,
        },
      ],
    })

    assert.deepEqual(profile, {
      name: 'Marie',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      skills: [{ name: 'React', level: 4 }],
      experiences: [
        {
          title: 'Dev',
          company: 'ACME',
          type: 'cdi',
          startDate: '2020-01-15',
          endDate: '',
          isCurrent: true,
          description: 'Front',
        },
      ],
      educations: [
        {
          degree: 'Master',
          school: 'Université',
          startDate: '2015-09-01',
          endDate: '2017-06-30',
          isCurrent: false,
          description: '',
        },
      ],
    })
  })

  test('remplace les champs absents ou non textuels par des chaînes vides', ({ assert }) => {
    const profile = profileOf({ name: null, currentRole: 3, targetRole: undefined })

    assert.deepEqual(profile, {
      name: '',
      currentRole: '',
      targetRole: '',
      summary: '',
      skills: [],
      experiences: [],
      educations: [],
    })
  })

  test('borne et arrondit le niveau de compétence, 3 par défaut', ({ assert }) => {
    const profile = profileOf({
      skills: [
        { name: 'A', $extras: { pivot_level: 9 } },
        { name: 'B', $extras: { pivot_level: 0 } },
        { name: 'C', $extras: { pivot_level: 2.6 } },
        { name: 'D', $extras: {} },
        { name: 'E' },
        { name: '', $extras: { pivot_level: 4 } },
      ],
    })

    assert.deepEqual(profile.skills, [
      { name: 'A', level: 5 },
      { name: 'B', level: 1 },
      { name: 'C', level: 3 },
      { name: 'D', level: 3 },
      { name: 'E', level: 3 },
    ])
  })

  test('ignore les dates dans un format inconnu', ({ assert }) => {
    const profile = profileOf({
      experiences: [{ title: 'X', startDate: 20200101, endDate: { foo: 1 }, isCurrent: 0 }],
    })

    assert.equal(profile.experiences[0].startDate, '')
    assert.equal(profile.experiences[0].endDate, '')
    assert.isFalse(profile.experiences[0].isCurrent)
  })

  test('ignore des relations qui ne sont pas des tableaux', ({ assert }) => {
    const profile = profileOf({ skills: 'React', experiences: {}, educations: null })
    assert.deepEqual(profile.skills, [])
    assert.deepEqual(profile.experiences, [])
    assert.deepEqual(profile.educations, [])
  })
})
