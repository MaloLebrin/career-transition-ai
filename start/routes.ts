/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const EmployeesController = () => import('#controllers/employees_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')
const AuthController = () => import('#controllers/auth_controller')

// Public / auth pages
// @ts-expect-error Inertia page name from generated types
router.on('/').renderInertia('Landing', {})
// @ts-expect-error Inertia page name from generated types
router.on('/auth').renderInertia('Auth', {})

// Auth JSON API
router
  .group(() => {
    router.get('/me', [AuthController, 'me'])
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('/auth')

// Dashboard (Inertia) routes. Requires auth; for admin-only use .use(['auth', 'admin'])
router
  .group(() => {
    // Dashboard: home uses dashboard/Home (replaces single Dashboard page)
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/Home', {})

    // Inertia form submissions (before :id routes)
    router.post('/employees', [EmployeesController, 'storeFromDashboard'])
    router.put('/employees/:id', [EmployeesController, 'updateFromDashboard'])

    router.put('/profile', [AuthController, 'updateFromDashboard'])

    router.get('/employees', [EmployeesController, 'indexDashboard'])
    router.get('/employees/:id', [EmployeesController, 'showDashboard'])
    router.get('/employees/:id/exercises/:type', [ExerciseResultsController, 'showDashboard'])
    router.post('/employees/:id/exercises/motivation/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
    router.post('/employees/:id/exercises/motivation/result', [ExerciseResultsController, 'storeFromDashboard'])
    router.post('/employees/:id/exercises/values/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
    router.post('/employees/:id/exercises/values/result', [ExerciseResultsController, 'storeFromDashboard'])
    router.post('/employees/:id/exercises/personality/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
    router.post('/employees/:id/exercises/personality/result', [ExerciseResultsController, 'storeFromDashboard'])

    router.put('/settings/organization', [OrganizationsController, 'updateFromDashboard'])
    router.post('/settings/organization/advisors', [OrganizationsController, 'storeAdvisorFromDashboard'])

    router.get('/settings', [OrganizationsController, 'settingsDashboard'])
    // @ts-expect-error Inertia page name from generated types
    router.on('/design-system').renderInertia('dashboard/DesignSystem', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/profile').renderInertia('dashboard/Profile', {})

    router.get('/exercises/:type', ({ params, inertia }) =>
      (inertia as any).render('dashboard/Exercise', { type: params.type })
    )
  })
  .use([middleware.auth()])
  .prefix('/dashboard')

// JSON API routes (nested groups by resource)
router
  .group(() => {
    // Employees + exercise results
    router
      .group(() => {
        router.post('/', [EmployeesController, 'store'])
        router.get('/', [EmployeesController, 'index'])
        router.get('/:id', [EmployeesController, 'show'])
        router.put('/:id', [EmployeesController, 'update'])
        router.post('/:id/exercises/result', [ExerciseResultsController, 'store'])
        router.post('/:id/exercises/draft', [ExerciseResultsController, 'saveDraft'])
        router.post('/:id/exercises/draft/fetch', [ExerciseResultsController, 'fetchDraft'])
      })
      .prefix('/employees')

    // Organizations + advisors (static /current before /:id)
    router
      .group(() => {
        router.get('/current', [OrganizationsController, 'current'])
        router.get('/:id', [OrganizationsController, 'show'])
        router.put('/:id', [OrganizationsController, 'update'])
        router.get('/:id/advisors', [OrganizationsController, 'indexAdvisors'])
        router.post('/:id/advisors', [OrganizationsController, 'storeAdvisor'])
      })
      .prefix('/organizations')
  })
  .prefix('/api')
