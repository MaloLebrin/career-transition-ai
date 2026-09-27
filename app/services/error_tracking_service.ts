import * as Sentry from '@sentry/node'
import type { ErrorEvent } from '@sentry/node'
import diagnostics_channel from 'node:diagnostics_channel'

/**
 * Suivi des erreurs en production (Sentry, issue #27).
 *
 * - `initErrorTracking` est appelé au démarrage du serveur et du worker
 *   (`start/error_tracking.ts`) ; sans DSN, rien n'est envoyé.
 * - `reportError` est le seul point d'envoi : le handler HTTP (5xx) et les
 *   échecs définitifs de jobs (`watchQueueFailures`) passent par lui.
 *
 * RGPD : l'utilisateur n'est identifié que par son id, jamais par son nom ni
 * son e-mail ; ni corps de requête, ni cookies, ni payload de job ne partent
 * chez Sentry (`scrubEvent`).
 */

export interface ErrorContext {
  /** Utilisateur connecté, réduit à son id. */
  userId?: number | string | null
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

export interface ErrorReporter {
  capture(error: unknown, context: ErrorContext): void
}

export interface ErrorTrackingOptions {
  dsn?: string
  environment?: string
  release?: string
}

/** En-têtes de requête conservés sur un événement : aucun ne porte d'identité. */
const SAFE_REQUEST_HEADERS = ['user-agent', 'accept', 'content-type', 'x-inertia']

let reporter: ErrorReporter | null = null

/** Remplace le rapporteur actif (tests) ; renvoie le précédent pour le restaurer. */
export function setErrorReporter(next: ErrorReporter | null): ErrorReporter | null {
  const previous = reporter
  reporter = next
  return previous
}

/** Vrai si un rapporteur est actif (Sentry initialisé avec un DSN). */
export function isErrorTrackingEnabled(): boolean {
  return reporter !== null
}

/** Envoie une erreur au suivi, si activé. Ne lève jamais. */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  try {
    reporter?.capture(error, context)
  } catch {
    // Le suivi des erreurs ne doit jamais casser la réponse ni le worker.
  }
}

/**
 * Retire d'un événement tout ce qui pourrait identifier une personne :
 * utilisateur réduit à son id, pas d'IP, de cookies, de corps de requête, de
 * query string, ni d'en-têtes hors liste blanche.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) {
    event.user = event.user.id === undefined ? undefined : { id: event.user.id }
  }
  if (event.request) {
    const headers = event.request.headers ?? {}
    event.request = {
      method: event.request.method,
      url: event.request.url?.split('?')[0],
      headers: Object.fromEntries(
        Object.entries(headers).filter(([name]) =>
          SAFE_REQUEST_HEADERS.includes(name.toLowerCase())
        )
      ),
    }
  }
  return event
}

/** Rapporteur Sentry : un scope isolé par erreur. */
export function sentryReporter(): ErrorReporter {
  return {
    capture(error, context) {
      Sentry.withScope((scope) => {
        if (context.userId !== undefined && context.userId !== null) {
          scope.setUser({ id: String(context.userId) })
        }
        if (context.tags) scope.setTags(context.tags)
        if (context.extra) scope.setExtras(context.extra)
        Sentry.captureException(error)
      })
    },
  }
}

/**
 * Initialise Sentry et active le rapporteur. `false` sans DSN (rien n'est
 * initialisé). `integrations` n'est passé que par les tests.
 */
export function initErrorTracking(
  options: ErrorTrackingOptions,
  overrides: Partial<Sentry.NodeOptions> = {}
): boolean {
  if (!options.dsn) return false

  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    sendDefaultPii: false,
    // Erreurs uniquement : pas de traces de performance (quota du plan gratuit).
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    ...overrides,
  })
  setErrorReporter(sentryReporter())
  return true
}

/** Vide la file d'envoi (arrêt du process). */
export async function flushErrorTracking(timeoutMs = 2000): Promise<void> {
  if (Sentry.isInitialized()) await Sentry.flush(timeoutMs)
}

/** Canal de traçage publié par `@boringnode/queue` à chaque exécution de job. */
export const QUEUE_EXECUTE_CHANNEL = 'boringqueue.job.execute'

interface QueueExecuteMessage {
  job: { id: string; name: string; attempts?: number }
  queue: string
  status?: string
  error?: unknown
}

/**
 * Signale les jobs en échec **définitif** (retries épuisés) ; les tentatives
 * qui seront rejouées ne sont pas envoyées. Le payload du job n'est jamais
 * transmis. Renvoie la fonction de désabonnement.
 */
export function watchQueueFailures(): () => void {
  const channel = diagnostics_channel.tracingChannel(QUEUE_EXECUTE_CHANNEL).asyncEnd
  const onAsyncEnd = (data: unknown) => {
    const message = data as QueueExecuteMessage
    if (message.status !== 'failed') return
    reportError(message.error, {
      tags: { queue: message.queue, job: message.job.name },
      extra: { jobId: message.job.id, attempts: message.job.attempts },
    })
  }
  channel.subscribe(onAsyncEnd)
  return () => {
    channel.unsubscribe(onAsyncEnd)
  }
}
