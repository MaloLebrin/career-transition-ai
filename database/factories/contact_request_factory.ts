import ContactRequest, {
  CONTACT_REQUEST_STATUSES,
  CONTACT_REQUEST_TYPES,
} from '#models/contact_request'
import factory from '@adonisjs/lucid/factories'

export const ContactRequestFactory = factory
  .define(ContactRequest, ({ faker }) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: null,
      organization: faker.company.name(),
      message: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(Object.values(CONTACT_REQUEST_TYPES)),
      status: CONTACT_REQUEST_STATUSES.PENDING,
    }
  })
  .build()
