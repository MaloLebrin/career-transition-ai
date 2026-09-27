import { test } from '@japa/runner'
import { extractCvDataFromMarkdown } from '#shared/helpers/ai/use_cases/extract_cv_from_markdown'
import { makeFakeAiClient } from './fake_ai_client.js'

test.group('extractCvDataFromMarkdown', () => {
  test('conserve les données bien formées fournies par l’IA', async ({ assert }) => {
    const { client, calls } = makeFakeAiClient({
      json: {
        name: 'Marie Martin',
        email: 'marie@example.com',
        currentRole: 'Développeuse',
        suggestedTargetRole: 'Lead Tech',
        summary: 'Profil produit.',
        skills: [{ name: 'TypeScript', level: 4 }],
        experiences: [
          {
            id: 'exp-1',
            title: 'Dev',
            company: 'ACME',
            type: 'CDD',
            startDate: '2020-01',
            endDate: '2022-01',
            isCurrent: false,
            description: 'Front',
          },
        ],
        educations: [
          {
            id: 'edu-1',
            degree: 'Master',
            school: 'Université',
            startDate: '2015',
            endDate: '2017',
            isCurrent: false,
            description: '',
          },
        ],
      },
    })

    const result = await extractCvDataFromMarkdown(client, '# CV Marie')

    assert.deepEqual(result, {
      name: 'Marie Martin',
      email: 'marie@example.com',
      currentRole: 'Développeuse',
      suggestedTargetRole: 'Lead Tech',
      summary: 'Profil produit.',
      skills: [{ name: 'TypeScript', level: 4 }],
      experiences: [
        {
          id: 'exp-1',
          title: 'Dev',
          company: 'ACME',
          type: 'CDD',
          startDate: '2020-01',
          endDate: '2022-01',
          isCurrent: false,
          description: 'Front',
        },
      ],
      educations: [
        {
          id: 'edu-1',
          degree: 'Master',
          school: 'Université',
          startDate: '2015',
          endDate: '2017',
          isCurrent: false,
          description: '',
        },
      ],
    })
    assert.include(calls[0].prompt, '# CV Marie')
    assert.deepEqual(calls[0].options, { temperature: 0.2 })
  })

  test('complète les champs manquants avec des valeurs par défaut', async ({ assert }) => {
    const { client } = makeFakeAiClient({
      json: {
        name: 12,
        experiences: [{ isCurrent: 1 }],
        educations: [{ id: '', startDate: 2015 }],
        skills: 'TypeScript',
      },
    })

    const result = await extractCvDataFromMarkdown(client, 'cv')

    assert.isNotNull(result)
    assert.equal(result!.name, '')
    assert.equal(result!.email, '')
    assert.equal(result!.summary, '')
    assert.deepEqual(result!.skills, [])

    const [exp] = result!.experiences
    assert.isString(exp.id)
    assert.isNotEmpty(exp.id)
    assert.isTrue(exp.isCurrent)
    assert.equal(exp.type, 'CDI')
    assert.equal(exp.title, '')
    assert.equal(exp.company, '')
    assert.equal(exp.startDate, '')
    assert.equal(exp.endDate, '')
    assert.equal(exp.description, '')

    const [edu] = result!.educations
    assert.isNotEmpty(edu.id)
    assert.isFalse(edu.isCurrent)
    assert.equal(edu.startDate, '')
    assert.equal(edu.degree, '')
    assert.equal(edu.school, '')
  })

  test('borne les niveaux de compétence entre 1 et 5 et écarte les compétences sans nom', async ({
    assert,
  }) => {
    const { client } = makeFakeAiClient({
      json: {
        skills: [
          { name: 'Excel', level: 9 },
          { name: 'Word', level: -2 },
          { name: 'Slack' },
          { name: 'Notion', level: 'expert' },
          { name: '', level: 3 },
          { level: 4 },
        ],
      },
    })

    const result = await extractCvDataFromMarkdown(client, 'cv')

    assert.deepEqual(result!.skills, [
      { name: 'Excel', level: 5 },
      { name: 'Word', level: 1 },
      { name: 'Slack', level: 3 },
      { name: 'Notion', level: 3 },
    ])
  })

  test("renvoie null quand la réponse n'est pas un objet", async ({ assert }) => {
    for (const json of [null, 'texte']) {
      const { client } = makeFakeAiClient({ json })
      assert.isNull(await extractCvDataFromMarkdown(client, 'cv'))
    }
  })

  test('renvoie null quand le client échoue', async ({ assert }) => {
    const { client } = makeFakeAiClient({ error: new Error('boom') })
    assert.isNull(await extractCvDataFromMarkdown(client, 'cv'))
  })
})
