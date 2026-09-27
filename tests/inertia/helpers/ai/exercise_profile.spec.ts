import { describe, expect, test } from 'vitest'
import { DateTime } from 'luxon'
import { buildEmployeeAiProfile } from '#shared/helpers/ai/exercise_profile'

describe('buildEmployeeAiProfile', () => {
  test('construit un profil IA normalisé à partir d’un employé chargé', () => {
    const profile = buildEmployeeAiProfile({
      name: 'Camille',
      currentRole: 'Comptable',
      targetRole: null,
      summary: 42,
      skills: [
        { name: 'Excel', $extras: { pivot_level: 4.6 } },
        { name: 'SQL', $extras: { pivot_level: 9 } },
        { name: 'Word', $extras: { pivot_level: 0 } },
        { name: 'Sans niveau' },
        { name: '' },
      ],
      experiences: [
        {
          title: 'Comptable',
          company: 'Fiducial',
          type: 'cdi',
          startDate: DateTime.fromISO('2018-01-15'),
          endDate: null,
          isCurrent: 1,
          description: 'Clôtures',
        },
        { title: 42, startDate: new Date('2015-03-02T00:00:00.000Z'), endDate: '2016-01-01' },
        { startDate: { toISODate: () => null }, endDate: 12345 },
      ],
      educations: [
        {
          degree: 'DCG',
          school: 'INTEC',
          startDate: '2014-09-01',
          endDate: DateTime.fromISO('2017-06-30'),
          isCurrent: false,
          description: undefined,
        },
      ],
    } as never)

    expect(profile).toEqual({
      name: 'Camille',
      currentRole: 'Comptable',
      targetRole: '',
      summary: '',
      skills: [
        { name: 'Excel', level: 5 },
        { name: 'SQL', level: 5 },
        { name: 'Word', level: 1 },
        { name: 'Sans niveau', level: 3 },
      ],
      experiences: [
        {
          title: 'Comptable',
          company: 'Fiducial',
          type: 'cdi',
          startDate: '2018-01-15',
          endDate: '',
          isCurrent: true,
          description: 'Clôtures',
        },
        {
          title: '',
          company: '',
          type: '',
          startDate: '2015-03-02',
          endDate: '2016-01-01',
          isCurrent: false,
          description: '',
        },
        {
          title: '',
          company: '',
          type: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
        },
      ],
      educations: [
        {
          degree: 'DCG',
          school: 'INTEC',
          startDate: '2014-09-01',
          endDate: '2017-06-30',
          isCurrent: false,
          description: '',
        },
      ],
    })
  })

  test('relations non préchargées : listes vides', () => {
    const profile = buildEmployeeAiProfile({ name: 'X' } as never)
    expect(profile.skills).toEqual([])
    expect(profile.experiences).toEqual([])
    expect(profile.educations).toEqual([])
  })
})
