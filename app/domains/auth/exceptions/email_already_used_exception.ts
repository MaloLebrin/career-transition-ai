import { Exception } from '@adonisjs/core/exceptions'

export default class EmailAlreadyUsedException extends Exception {
  constructor(message: string = 'Cet email est déjà utilisé.') {
    super(message, {
      status: 409,
      code: 'E_EMAIL_ALREADY_USED',
    })
  }
}

