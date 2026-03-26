import DomainException from '#exceptions/domain_exception'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

const DOMAIN_EXCEPTIONS = [
  DomainException,
  EmailAlreadyUsedException,
  OrganizationNameAlreadyUsedException,
  InvalidCredentialsException,
]

function isDomainException(
  error: unknown
): error is InstanceType<(typeof DOMAIN_EXCEPTIONS)[number]> {
  return DOMAIN_EXCEPTIONS.some((C) => error instanceof C)
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Erreurs métier attendues : ne pas envoyer aux services de monitoring.
   */
  protected ignoreCodes = [
    'E_EMAIL_ALREADY_USED',
    'E_ORGANIZATION_NAME_ALREADY_USED',
    'E_INVALID_CREDENTIALS',
    'E_DOMAIN_ERROR',
  ]

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    // @ts-expect-error Inertia page names from generated types
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    // @ts-expect-error Inertia page names from generated types
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }

  /**
   * Domain exceptions (auth, validation métier) : en requête Inertia on fait
   * flash + redirect back ; en JSON on renvoie status + message.
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (isDomainException(error)) {
      const message = error.message
      const status = (error as { status?: number }).status ?? 400
      if (ctx.request.header('x-inertia') === 'true') {
        ctx.session.flash('error', message)
        return ctx.response.redirect().back()
      }
      return ctx.response.status(status).json({ message })
    }
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
