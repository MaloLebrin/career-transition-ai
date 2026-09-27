import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import { apiClient } from '@japa/api-client'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import env from '#start/env'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  // Client HTTP des suites `functional` : `client.get(...).loginAs(user)`
  // (session web), `.withInertia()` et `response.assertInertiaComponent(...)`.
  // Remplace les `fetch` + recopie manuelle des cookies de session.
  apiClient({
    baseURL: `http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || '3333'}`,
  }),
  sessionApiClient(app),
  authApiClient(app),
  inertiaApiClient(app),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => {
      // Garde-fou : la suite tronque des tables (`truncateDb()`), elle ne doit
      // jamais tourner sur une base qui n'est pas celle de `.env.test`.
      if (env.get('NODE_ENV') !== 'test') {
        throw new Error(`Refusing to run tests with NODE_ENV=${env.get('NODE_ENV')}`)
      }
    },
    // Les migrations sont jouées une fois pour toute la session de tests ; le
    // rollback rendu par `migrate()` est exécuté au teardown.
    () => testUtils.db().migrate(),
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    // Tests HTTP : le serveur tourne dans le même process, mais ses handlers
    // passent par des connexions du pool distinctes de celle du test — une
    // transaction globale leur serait invisible. Isolation par `truncateDb()`
    // (tests/utils/db.ts) dans chaque groupe.
    suite.setup(() => testUtils.httpServer().start())
  } else if (suite.name === 'integration') {
    suite.setup(() => testUtils.db().withGlobalTransaction())
  }
  // unit : chaque groupe pose sa propre isolation (`withGlobalTransaction()`)
}
