/*
|--------------------------------------------------------------------------
| Rate limiting des endpoints publics (issue #23)
|--------------------------------------------------------------------------
|
| Middlewares à appliquer route par route (`.use(throttleLogin)`). Au-delà du
| quota : 429 (`Retry-After`, `X-RateLimit-*`) ; une requête Inertia reçoit à
| la place un flash + redirect back (`app/exceptions/handler.ts`).
|
| Les clés reposent sur `clientIp()` et non `request.ip()`, falsifiable via
| `X-Forwarded-For` avec le `trustProxy` de `config/app.ts`.
|
*/

import { clientIp } from '#utils/client_ip'
import { rateLimitMessage } from '#shared/helpers/rate_limit'
import limiter from '@adonisjs/limiter/services/main'
import type { errors } from '@adonisjs/limiter'
import type { HttpContext } from '@adonisjs/core/http'

type ThrottleException = InstanceType<typeof errors.E_TOO_MANY_REQUESTS>

function frenchMessage(error: ThrottleException) {
  error.setMessage(rateLimitMessage(error.response.availableIn))
}

/** Force brute sur le mot de passe d'un compte : 5/min par IP et par e-mail. */
export const throttleLogin = limiter.define('login', ({ request }: HttpContext) => {
  const email = String(request.input('email', '')).trim().toLowerCase()
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .usingKey(`${clientIp(request)}_${email}`)
    .limitExceeded(frenchMessage)
})

/** Création de comptes en masse : 3/h par IP. */
export const throttleRegister = limiter.define('register', ({ request }: HttpContext) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(clientIp(request))
    .limitExceeded(frenchMessage)
})

/** Chaque demande envoie deux e-mails (quota Resend) : 3/h par IP. */
export const throttleContactRequests = limiter.define(
  'contact_requests',
  ({ request }: HttpContext) => {
    return limiter
      .allowRequests(3)
      .every('1 hour')
      .usingKey(clientIp(request))
      .limitExceeded(frenchMessage)
  }
)

/** Énumération des jetons d'onboarding : 10/min par IP. */
export const throttleOnboarding = limiter.define('onboarding', ({ request }: HttpContext) => {
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(clientIp(request))
    .limitExceeded(frenchMessage)
})

/**
 * « Mot de passe oublié » (#68) : chaque demande peut envoyer un e-mail (quota
 * Resend, harcèlement d'une boîte) : 5 / 15 min par IP.
 */
export const throttleForgotPassword = limiter.define(
  'forgot_password',
  ({ request }: HttpContext) => {
    return limiter
      .allowRequests(5)
      .every('15 minutes')
      .usingKey(clientIp(request))
      .limitExceeded(frenchMessage)
  }
)

/** Énumération des liens de réinitialisation (GET et POST) : 10/min par IP. */
export const throttlePasswordReset = limiter.define(
  'password_reset',
  ({ request }: HttpContext) => {
    return limiter
      .allowRequests(10)
      .every('1 minute')
      .usingKey(clientIp(request))
      .limitExceeded(frenchMessage)
  }
)

/**
 * Changement de mot de passe connecté (#68) : devinette du mot de passe
 * actuel depuis une session volée. 5 / 15 min par compte.
 */
export const throttleChangePassword = limiter.define(
  'change_password',
  ({ auth, request }: HttpContext) => {
    return limiter
      .allowRequests(5)
      .every('15 minutes')
      .usingKey(auth.user ? `user_${auth.user.id}` : clientIp(request))
      .limitExceeded(frenchMessage)
  }
)

/**
 * Renvoi du lien de vérification d'e-mail (#98) : chaque demande envoie un
 * e-mail (quota Resend). 5 / 15 min par compte.
 */
export const throttleEmailVerification = limiter.define(
  'email_verification',
  ({ auth, request }: HttpContext) => {
    return limiter
      .allowRequests(5)
      .every('15 minutes')
      .usingKey(auth.user ? `user_${auth.user.id}` : clientIp(request))
      .limitExceeded(frenchMessage)
  }
)

/**
 * Appels au fournisseur IA (quota et facturation) : 20/min par utilisateur.
 * Appliqué après `auth()`, d'où la clé sur l'identifiant du compte.
 */
export const throttleAi = limiter.define('ai', ({ auth, request }: HttpContext) => {
  return limiter
    .allowRequests(20)
    .every('1 minute')
    .usingKey(auth.user ? `user_${auth.user.id}` : clientIp(request))
    .limitExceeded(frenchMessage)
})

/**
 * Export RGPD du candidat (#70) : génère un PDF et relit ses documents sur
 * Cloudinary. 5 / heure par compte.
 */
export const throttleDataExport = limiter.define(
  'data_export',
  ({ auth, request }: HttpContext) => {
    return limiter
      .allowRequests(5)
      .every('1 hour')
      .usingKey(auth.user ? `user_${auth.user.id}` : clientIp(request))
      .limitExceeded(frenchMessage)
  }
)
