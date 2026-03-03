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

// @ts-expect-error Inertia page name from generated types
router.on('/').renderInertia('Landing', {})
// @ts-expect-error Inertia page name from generated types
router.on('/auth').renderInertia('Auth', {})

// Dashboard: home uses dashboard/Home (replaces single Dashboard page)
// @ts-expect-error Inertia page name from generated types
router.on('/dashboard').renderInertia('dashboard/Home', {})

router.get('/dashboard/employees', ({ inertia }) =>
  (inertia as any).render('dashboard/Employees', {})
)
router.get('/dashboard/employees/:id', ({ params, inertia }) =>
  (inertia as any).render('dashboard/EmployeeDetail', { employeeId: params.id })
)
router.get('/dashboard/employees/:id/exercises/:type', ({ params, inertia }) =>
  (inertia as any).render('dashboard/Exercise', { type: params.type, employeeId: params.id })
)

// @ts-expect-error Inertia page name from generated types
router.on('/dashboard/settings').renderInertia('dashboard/Settings', {})
// @ts-expect-error Inertia page name from generated types
router.on('/dashboard/design-system').renderInertia('dashboard/DesignSystem', {})
// @ts-expect-error Inertia page name from generated types
router.on('/dashboard/profile').renderInertia('dashboard/Profile', {})

router.get('/dashboard/exercises/:type', ({ params, inertia }) =>
  (inertia as any).render('dashboard/Exercise', { type: params.type })
)

router.post('/api/employees', [EmployeesController, 'store'])
router.get('/api/employees', [EmployeesController, 'index'])
router.get('/api/employees/:id', [EmployeesController, 'show'])
router.put('/api/employees/:id', [EmployeesController, 'update'])

router.post('/api/employees/:id/exercises/result', [ExerciseResultsController, 'store'])
