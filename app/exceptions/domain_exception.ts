import { Exception } from '@adonisjs/core/exceptions'

/**
 * Base exception for domain/business errors.
 * Use subclasses or this with status + code for consistent API and Inertia handling.
 */
export default class DomainException extends Exception {
  constructor(
    message: string,
    options: { status?: number; code?: string } = {}
  ) {
    super(message, {
      status: options.status ?? 400,
      code: options.code ?? 'E_DOMAIN_ERROR',
    })
  }
}
