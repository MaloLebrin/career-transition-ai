import Organization from '#models/organization'
import { generateSlug } from '#utils/slug'
import factory from '@adonisjs/lucid/factories'

export const OrganizationFactory = factory
  .define(Organization, ({ faker }) => {
    const name = faker.company.name()
    const baseSlug = generateSlug(name)

    return {
      name,
      slug: `${baseSlug}-${faker.string.alphanumeric(6).toLowerCase()}`,
      logoUrl: null,
    }
  })
  .build()
