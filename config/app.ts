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
   * confiance qu'à `loopback` : `request.protocol()` renvoie `http` et les liens
   * d'onboarding construits avec `${request.protocol()}://${request.hostname()}`
   * sont générés en `http://`. On fait confiance aux en-têtes
   * `X-Forwarded-Proto` / `X-Forwarded-Host` / `X-Forwarded-For` du proxy.
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
