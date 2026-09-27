/*
|--------------------------------------------------------------------------
| Suivi des erreurs (Sentry)
|--------------------------------------------------------------------------
|
| Serveur HTTP et worker (`node ace queue:work`). Sans `SENTRY_DSN`, rien
| n'est initialisé. Les erreurs HTTP 5xx sont envoyées par
| `app/exceptions/handler.ts`, les jobs en échec définitif ici.
|
*/

import errorTrackingConfig from '#config/error_tracking'
import {
  flushErrorTracking,
  initErrorTracking,
  watchQueueFailures,
} from '#services/error_tracking_service'
import app from '@adonisjs/core/services/app'

if (initErrorTracking(errorTrackingConfig)) {
  const unwatch = watchQueueFailures()
  app.terminating(async () => {
    unwatch()
    await flushErrorTracking()
  })
}
