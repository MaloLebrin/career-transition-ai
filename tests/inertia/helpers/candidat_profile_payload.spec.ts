import { describe, expect, test } from 'vitest'
import { candidatProfileUpdatePayload } from '../../../inertia/helpers/candidat_profile_payload'

describe('candidatProfileUpdatePayload', () => {
  test('n’inclut que les champs définis', () => {
    expect(candidatProfileUpdatePayload({})).toEqual({})
    expect(candidatProfileUpdatePayload({ name: 'Camille', onboarded: false })).toEqual({
      name: 'Camille',
      onboarded: false,
    })
  })

  test('mappe les listes sans les identifiants et avec des valeurs par défaut', () => {
    const payload = candidatProfileUpdatePayload({
      email: 'c@example.com',
      currentRole: 'Comptable',
      targetRole: 'Data analyst',
      summary: 'Résumé',
      experiences: [
        {
          id: 1,
          title: 'Comptable',
          company: 'Fiducial',
          type: 'CDI',
          startDate: '2018-01',
          endDate: '2020-01',
          isCurrent: false,
          description: 'x',
        },
        { id: 2 } as never,
      ],
      educations: [{ id: 3 } as never],
      skills: [{ name: '  Excel  ', level: 4 }, {} as never],
    })

    expect(payload).toEqual({
      email: 'c@example.com',
      currentRole: 'Comptable',
      targetRole: 'Data analyst',
      summary: 'Résumé',
      experiences: [
        {
          title: 'Comptable',
          company: 'Fiducial',
          type: 'CDI',
          startDate: '2018-01',
          endDate: '2020-01',
          isCurrent: false,
          description: 'x',
        },
        {
          title: '',
          company: '',
          type: undefined,
          startDate: '',
          endDate: undefined,
          isCurrent: false,
          description: '',
        },
      ],
      educations: [
        {
          degree: '',
          school: '',
          startDate: '',
          endDate: undefined,
          isCurrent: false,
          description: '',
        },
      ],
      skills: [
        { name: 'Excel', level: 4 },
        { name: '', level: 3 },
      ],
    })
  })

  test('listes nulles → tableaux vides', () => {
    expect(
      candidatProfileUpdatePayload({ experiences: null, educations: null, skills: null } as never)
    ).toEqual({ experiences: [], educations: [], skills: [] })
  })
})
