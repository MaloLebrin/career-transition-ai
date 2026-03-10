import { Exception } from '@adonisjs/core/exceptions'

export default class OrganizationNameAlreadyUsedException extends Exception {
  constructor(message: string = 'Une organisation avec ce nom existe déjà.') {
    super(message, {
      status: 409,
      code: 'E_ORGANIZATION_NAME_ALREADY_USED',
    })
  }
}
