import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import {
  AI_PSEUDONYM,
  buildEmployeeAiProfile,
  pseudonymizeForAi,
} from '#shared/helpers/ai/exercise_profile'

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

test.group('buildEmployeeAiProfile | RGPD', () => {
  test("n'expose ni le nom ni l'e-mail du candidat", ({ assert }) => {
    const profile = profileOf({ name: 'Marie Martin', email: 'marie@example.com' })
    assert.notProperty(profile, 'name')
    assert.notProperty(profile, 'email')
    assert.notInclude(JSON.stringify(profile), 'Marie')
  })
})

test.group('pseudonymizeForAi', () => {
  const identity = { name: 'Hélène Martin-Dupont', email: 'helene.md@example.com' }

  test('remplace nom complet, fragments et e-mail dans toutes les chaînes', ({ assert }) => {
    const data = {
      summary: 'Hélène Martin-Dupont, cheffe de projet. Contact : helene.md@example.com',
      answers: [{ text: 'Mon manager appelait toujours Hélène en réunion.' }, 42, null],
      nested: { note: 'Madame DUPONT a quitté le poste', flag: true },
    }

    assert.deepEqual(pseudonymizeForAi(data, identity), {
      summary: `${AI_PSEUDONYM}, cheffe de projet. Contact : ${AI_PSEUDONYM}`,
      answers: [{ text: `Mon manager appelait toujours ${AI_PSEUDONYM} en réunion.` }, 42, null],
      nested: { note: `Madame ${AI_PSEUDONYM} a quitté le poste`, flag: true },
    })
  })

  test('ne remplace pas un fragment inclus dans un autre mot', ({ assert }) => {
    const result = pseudonymizeForAi(
      { text: 'Martinez, Dupontel et Hélènerie restent intacts' },
      identity
    )
    assert.equal(result.text, 'Martinez, Dupontel et Hélènerie restent intacts')
  })

  test('ignore les fragments trop courts et les particules', ({ assert }) => {
    const result = pseudonymizeForAi(
      { text: 'Li habite à Lille, près de la gare des Van' },
      { name: 'Li de Van' }
    )
    assert.equal(result.text, 'Li habite à Lille, près de la gare des Van')
  })

  test('laisse la valeur intacte sans identité connue', ({ assert }) => {
    const data = { text: 'Hélène' }
    assert.strictEqual(pseudonymizeForAi(data, { name: '', email: null }), data)
  })

  test("masque l'e-mail entier même s'il contient le prénom", ({ assert }) => {
    const result = pseudonymizeForAi('Écrire à marie@ex.io', {
      name: 'Marie',
      email: 'marie@ex.io',
    })
    assert.equal(result, `Écrire à ${AI_PSEUDONYM}`)
  })

  test('échappe les caractères spéciaux des identifiants', ({ assert }) => {
    const result = pseudonymizeForAi(['a.b+c@x.io', 'aXb+c@x.io'], { email: 'a.b+c@x.io' })
    assert.deepEqual(result, [AI_PSEUDONYM, 'aXb+c@x.io'])
  })
})
