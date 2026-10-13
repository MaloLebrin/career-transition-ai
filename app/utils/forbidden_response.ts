import type { HttpContext } from '@adonisjs/core/http'

/**
 * La requête attend-elle une page (visite Inertia ou navigation du navigateur) ?
 * Les clients JSON (API, tests) n'envoient ni `X-Inertia` ni `Accept: text/html`.
 */
export function wantsPage(ctx: Pick<HttpContext, 'request'>): boolean {
  if (ctx.request.header('x-inertia') === 'true') return true
  return (ctx.request.header('accept') ?? '').includes('text/html')
}

/**
 * Refus d'accès (403) des middlewares de rôle : page `errors/forbidden` pour une
 * visite Inertia ou une navigation, `{ message }` en JSON pour les autres clients.
 * Le message est le texte du refus (jamais un détail technique).
 */
export async function denyAccess(ctx: HttpContext, message: string) {
  if (wantsPage(ctx)) {
    // Un middleware doit envoyer lui-même la réponse : sa valeur de retour n'est pas le corps.
    const page = await ctx.inertia.render('errors/forbidden', { message })
    return ctx.response.status(403).send(page)
  }
  return ctx.response.forbidden({ message })
}
