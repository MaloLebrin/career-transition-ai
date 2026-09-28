import DomainException from '#exceptions/domain_exception'
import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import OrganizationNameAlreadyUsedException from '#exceptions/organization_name_already_used_exception'
import { reportError } from '#services/error_tracking_service'
import { RATE_LIMIT_ERROR_KEY } from '#shared/helpers/rate_limit'
import app from '@adonisjs/core/services/app'
import { errors as limiterErrors } from '@adonisjs/limiter'
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
    'E_NOTE_NOT_FOUND',
    'E_NOTE_FORBIDDEN',
    'E_NOTE_LINKED_RESOURCE_NOT_FOUND',
    'E_MEDIA_NOT_FOUND',
    'E_MEDIA_LIMIT_REACHED',
    'E_MEDIA_FORBIDDEN',
    'E_PDF_EXPORT_NOT_FOUND',
    'E_PDF_EXPORT_NOT_READY',
  ]

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
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
    if (
      error instanceof limiterErrors.E_TOO_MANY_REQUESTS &&
      ctx.request.header('x-inertia') === 'true'
    ) {
      return this.handleInertiaThrottle(error, ctx)
    }
    return super.handle(error, ctx)
  }

  /**
   * Rate limiting (`start/limiter.ts`) sur une requête Inertia : un 429 brut
   * s'afficherait dans une modale. On garde les en-têtes `Retry-After` /
   * `X-RateLimit-*`, on flashe le message (bandeau de la page) et une erreur de
   * formulaire (`useForm` échoue au lieu de passer en `wasSuccessful`), puis
   * redirect back. Hors Inertia, l'exception répond elle-même 429.
   */
  private handleInertiaThrottle(
    error: InstanceType<typeof limiterErrors.E_TOO_MANY_REQUESTS>,
    ctx: HttpContext
  ) {
    const message = error.getResponseMessage(ctx)
    for (const [name, value] of Object.entries(error.getDefaultHeaders())) {
      ctx.response.header(name, value)
    }
    ctx.session.flash('error', message)
    ctx.session.flash('inputErrorsBag', { [RATE_LIMIT_ERROR_KEY]: message })
    // 303 : l'upgrade 302 → 303 du middleware Inertia ne s'applique pas ici.
    return ctx.response.redirect().status(303).back()
  }

  /**
   * Log (parent), puis envoi au suivi des erreurs (`#services/error_tracking_service`)
   * des seules erreurs serveur : les 4xx et les erreurs métier ignorées
   * (`ignoreCodes`, `ignoreStatuses`…) restent dans les logs. L'utilisateur
   * n'est transmis que par son id.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    await super.report(error, ctx)

    const httpError = this.toHttpError(error)
    if (!this.shouldReport(httpError) || httpError.status < 500) return

    reportError(error, {
      userId: ctx.auth?.user?.id ?? null,
      tags: { method: ctx.request.method(), route: ctx.route?.pattern ?? 'unknown' },
      extra: { status: httpError.status },
    })
  }
}
