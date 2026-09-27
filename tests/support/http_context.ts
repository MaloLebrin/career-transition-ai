import type { HttpContext } from '@adonisjs/core/http'

/**
 * Faux `HttpContext` pour les specs unit de middleware (repris de boat-management).
 *
 * Un middleware ne consomme qu'une poignée de propriétés du contexte — les
 * fournir en littéral évite de démarrer un serveur HTTP pour tester une
 * redirection ou un refus.
 *
 * Le contexte **enregistre** ce qu'on lui fait (redirections, refus, appels
 * d'authentification) au lieu de l'exécuter : les assertions portent sur ces
 * journaux, ce qui rend visible aussi bien ce qui a été fait que ce qui ne
 * l'a pas été.
 *
 * Les journaux sont des **références vivantes**, jamais des accesseurs : un
 * spec les déstructure (`const { ctx, redirects } = makeCtx()`), ce qui
 * figerait la valeur d'un getter au moment de la déstructuration.
 */

export interface FakeCtxOptions {
  /** Utilisateur exposé par `ctx.auth.user` (et `getUserOrFail()`). */
  user?: unknown
  /** Réponse de `auth.use(guard).check()` et de `auth.check()`. */
  authenticated?: boolean
  /** Garde par défaut, tel que `ctx.auth.defaultGuard` l'expose. */
  defaultGuard?: string
  /** Erreur levée par `auth.authenticateUsing()`. */
  authenticateError?: Error
  /** Verbe HTTP renvoyé par `ctx.request.method()`. */
  method?: string
}

export interface FakeRedirect {
  target: string
  /** 2ᵉ argument de `response.redirect(target, forwardQs)`. */
  forwardQs?: boolean
}

export interface FakeCtx {
  ctx: HttpContext
  /** Cibles passées à `response.redirect()`, dans l'ordre. */
  redirects: string[]
  /** Idem, avec le report de query string. */
  redirectCalls: FakeRedirect[]
  /** Corps passés à `response.forbidden()`. */
  forbidden: unknown[]
  /** Corps passés à `response.unauthorized()` (`undefined` si appelé sans argument). */
  unauthorized: unknown[]
  /** Gardes passées à `auth.use()`. */
  checkedGuards: Array<string | undefined>
  /** Arguments reçus par `auth.authenticateUsing()`. */
  authenticateCalls: Array<{ guards: unknown; options: unknown }>
  /** Compteur d'appels à `auth.check()` — objet mutable, pas un nombre figé. */
  authChecks: { count: number }
  /** Messages passés à `session.flash(key, value)`, dans l'ordre. */
  flashed: Array<{ key: string; value: unknown }>
}

export function makeCtx(options: FakeCtxOptions = {}): FakeCtx {
  const redirects: string[] = []
  const redirectCalls: FakeRedirect[] = []
  const forbidden: unknown[] = []
  const unauthorized: unknown[] = []
  const checkedGuards: Array<string | undefined> = []
  const authenticateCalls: Array<{ guards: unknown; options: unknown }> = []
  const authChecks = { count: 0 }
  const flashed: Array<{ key: string; value: unknown }> = []

  const ctx = {
    request: {
      method: () => options.method ?? 'GET',
    },
    session: {
      flash: (key: string, value: unknown) => {
        flashed.push({ key, value })
      },
    },
    auth: {
      defaultGuard: options.defaultGuard ?? 'web',
      user: options.user,
      getUserOrFail: () => options.user,
      check: async () => {
        authChecks.count++
        return options.authenticated ?? false
      },
      use: (guard?: string) => {
        checkedGuards.push(guard)
        return { check: async () => options.authenticated ?? false }
      },
      authenticateUsing: async (guards: unknown, authOptions: unknown) => {
        authenticateCalls.push({ guards, options: authOptions })
        if (options.authenticateError) throw options.authenticateError
      },
    },
    response: {
      redirect: (target: string, forwardQs?: boolean) => {
        redirects.push(target)
        redirectCalls.push({ target, forwardQs })
      },
      forbidden: (body?: unknown) => {
        forbidden.push(body)
      },
      unauthorized: (body?: unknown) => {
        unauthorized.push(body)
      },
    },
  } as never as HttpContext

  return {
    ctx,
    redirects,
    redirectCalls,
    forbidden,
    unauthorized,
    checkedGuards,
    authenticateCalls,
    authChecks,
    flashed,
  }
}

/** `next()` de middleware qui compte ses appels. */
export function makeNext() {
  const calls = { count: 0 }
  const next = async () => {
    calls.count++
  }
  return { next, calls }
}
