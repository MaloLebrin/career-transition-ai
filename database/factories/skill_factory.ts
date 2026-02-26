import Skill from '#models/skill'
import factory from '@adonisjs/lucid/factories'
import { generateSlug } from '../../app/utils/slug.js'

export const SkillFactory = factory
  .define(Skill, ({ faker }) => {
    const name = faker.helpers.arrayElement([
      'Management de projet',
      'Communication',
      'Leadership',
      'Vente B2B',
      'React',
      'TypeScript',
      'Analyse de données',
    ])

    const baseSlug = generateSlug(name)

    return {
      organizationId: null, // global par défaut, à surcharger si besoin
      name,
      slug: `${baseSlug}-${faker.string.alphanumeric(4).toLowerCase()}`,
      category: faker.helpers.arrayElement([
        'Management',
        'Commercial',
        'Technique',
        'Soft skills',
        'Communication',
      ]),
    }
  })
  .build()
