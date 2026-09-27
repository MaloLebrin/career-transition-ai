import type { HttpContext } from '@adonisjs/core/http'

/**
 * IP du client pour les clés de rate limiting.
 *
 * `trustProxy: () => true` (`config/app.ts`) fait renvoyer à `request.ip()`
 * l'entrée la plus à **gauche** de `X-Forwarded-For` : c'est celle que le
 * client écrit lui-même. Un attaquant qui change d'en-tête à chaque requête
 * changerait de compteur. Le reverse proxy devant l'app (Caddy, Render,
 * Tailscale Funnel…) **ajoute** l'IP qu'il voit en fin de liste (ou remplace
 * l'en-tête) : l'entrée la plus à droite est la seule non falsifiable.
 *
 * Sans en-tête (appel direct, tests), repli sur `request.ip()`.
 */
export function clientIp(request: HttpContext['request']): string {
  const forwarded = request.header('x-forwarded-for')
  const hops = (forwarded ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter((hop) => hop !== '')
  return hops.at(-1) ?? request.ip()
}
