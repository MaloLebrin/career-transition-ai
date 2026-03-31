import router from '@adonisjs/core/services/router'

/**
 * Compat routes to avoid 404 spam for legacy/broken asset URLs.
 *
 * These paths can be requested when a client has stale HTML/JS or when some
 * assets are referenced via relative paths under /dashboard or with "~/".
 * We return 204 (no content) to stop the browser from retrying and to keep
 * the console/network clean.
 */

router.get('/dashboard/inertia/assets/images/:file', async ({ response }) => {
  return response.noContent()
})

router.get('/dashboard/inertia/assets/images/:file/*', async ({ response }) => {
  return response.noContent()
})

router.get('/dashboard/candidat/steps/~/assets/images/logo.png', async ({ response }) => {
  return response.noContent()
})

router.get('/dashboard/candidat/exercises/~/assets/images/logo.png', async ({ response }) => {
  return response.noContent()
})

router.get('/dashboard/~/assets/images/logo.png', async ({ response }) => {
  return response.noContent()
})

router.get('/auth/~/assets/images/logo.png', async ({ response }) => {
  return response.noContent()
})

