import { defineConfig } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,

  /**
   * L'app n'est jamais exposée sans reverse proxy (Caddy, Render, Koyeb,
   * Tailscale Funnel…) qui termine le TLS. Sans `trustProxy`, AdonisJS ne fait
   * confiance qu'à `loopback` et `request.protocol()` renvoie `http`. On fait
   * confiance aux en-têtes `X-Forwarded-Proto` / `X-Forwarded-Host` /
   * `X-Forwarded-For` du proxy — ils restent fournis par le client : jamais de
   * lien envoyé par e-mail construit depuis la requête (`APP_URL`, #64), jamais
   * `request.ip()` pour une clé de rate limiting (`clientIp()`).
   */
  trustProxy: () => true,

  /**
   * Enabling async local storage will let you access HTTP context
   * from anywhere inside your application.
   */
  useAsyncLocalStorage: false,

  /**
   * Manage cookies configuration. The settings for the session id cookie are
   * defined inside the "config/session.ts" file.
   */
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2d',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})
