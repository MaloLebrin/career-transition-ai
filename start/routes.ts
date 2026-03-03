/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
// @ts-expect-error Inertia page name from generated types
router.on('/').renderInertia('Landing', {})
// @ts-expect-error Inertia page name from generated types
router.on('/auth').renderInertia('Auth', {})
// @ts-expect-error Inertia page name from generated types
router.on('/dashboard').renderInertia('Dashboard', {})
