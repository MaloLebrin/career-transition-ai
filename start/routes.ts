/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
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

// Dashboard (Inertia) routes. For admin-only routes use .use(['auth', 'admin'])
router
  .group(() => {
    // Dashboard: home uses dashboard/Home (replaces single Dashboard page)
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/Home', {})

    router.get('/employees', ({ inertia }) => (inertia as any).render('dashboard/Employees', {}))
    router.get('/employees/:id', ({ params, inertia }) =>
      (inertia as any).render('dashboard/EmployeeDetail', { employeeId: params.id })
    )
    router.get('/employees/:id/exercises/:type', ({ params, inertia }) =>
      (inertia as any).render('dashboard/Exercise', { type: params.type, employeeId: params.id })
    )

    // @ts-expect-error Inertia page name from generated types
    router.on('/settings').renderInertia('dashboard/Settings', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/design-system').renderInertia('dashboard/DesignSystem', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/profile').renderInertia('dashboard/Profile', {})

    router.get('/exercises/:type', ({ params, inertia }) =>
      (inertia as any).render('dashboard/Exercise', { type: params.type })
    )
  })
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
