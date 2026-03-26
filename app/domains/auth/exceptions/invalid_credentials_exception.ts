import { Exception } from '@adonisjs/core/exceptions'

export default class InvalidCredentialsException extends Exception {
  constructor(message: string = 'Identifiants invalides') {
    super(message, {
      status: 401,
      code: 'E_INVALID_CREDENTIALS',
    })
  }
}

