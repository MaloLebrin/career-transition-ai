/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const DashboardController = () => import('#controllers/dashboard_controller')
const EmployeesController = () => import('#controllers/employees_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')
const AuthController = () => import('#controllers/auth_controller')
const SuperAdminController = () => import('#controllers/super_admin_controller')
const OnboardingController = () => import('#controllers/onboarding_controller')

// Public / auth pages
// @ts-expect-error Inertia page name from generated types
router.on('/').renderInertia('Landing', {})
// Auth pages: guest middleware redirects already-logged-in users to /dashboard
router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/login').renderInertia('Login', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/register').renderInertia('Register', {})
  })
  .use([middleware.guest()])
router.get('/auth', ({ response }) => response.redirect('/auth/login'))

// Auth JSON API
router
  .group(() => {
    router.get('/me', [AuthController, 'me'])
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/impersonate/:id', [AuthController, 'impersonate'])
    router.post('/reset-password/:id', [AuthController, 'resetPassword'])
  })
  .prefix('/auth')

// Onboarding (guest): set password via email link
router
  .group(() => {
    router.get('/:token', [OnboardingController, 'show'])
    router.post('/:token', [OnboardingController, 'submit'])
  })
  .prefix('/onboarding')

// Dashboard entry: redirect to role-specific area
router
  .group(() => {
    router.get('/', [DashboardController, 'index'])
  })
  .use([middleware.auth()])
  .prefix('/dashboard')

// Dashboard candidat (employee only)
router
  .group(() => {
    router.get('/', [DashboardController, 'candidatHome'])
    router.get('/profile', ({ inertia }) =>
      (inertia as any).render('dashboard/Profile', {})
    )
    router.put('/profile', [AuthController, 'updateProfileCandidat'])
    router.get('/exercises', [ExerciseResultsController, 'exerciseListCandidat'])
    router.get('/exercises/:type', [ExerciseResultsController, 'showDashboardCandidat'])
    router.post('/exercises/:type/draft', [ExerciseResultsController, 'saveDraftFromDashboardCandidat'])
    router.post('/exercises/:type/result', [ExerciseResultsController, 'storeFromDashboardCandidat'])
  })
  .use([middleware.auth(), middleware.candidate()])
  .prefix('/dashboard/candidat')

// Dashboard conseiller (advisor, admin, super_admin)
router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/Home', { dashboardContext: 'conseiller' })
    // Inertia form submissions (before :id routes)
    router.post('/employees', [EmployeesController, 'storeFromDashboard'])
    router.put('/employees/:id', [EmployeesController, 'updateFromDashboard'])

    router.put('/profile', [AuthController, 'updateFromDashboard'])

    router.get('/employees', [EmployeesController, 'indexDashboard'])
    router.get('/employees/:id/profile', [EmployeesController, 'showProfileDashboard'])
    router.get('/employees/:id/dossier', [EmployeesController, 'downloadDossier'])
    router.get('/employees/:id', [EmployeesController, 'showDashboard'])
    router.get('/employees/:id/exercises', [ExerciseResultsController, 'exerciseListConseiller'])
    router.get('/employees/:id/exercise-results/:type', [
      ExerciseResultsController,
      'showExerciseResultConseiller',
    ])
    router.get('/employees/:id/exercises/:type', [ExerciseResultsController, 'showDashboard'])
    router
      .post('/employees/:id/exercises/motivation/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.motivation.draft')
    router
      .post('/employees/:id/exercises/motivation/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.motivation.result')
    router
      .post('/employees/:id/exercises/values/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.values.draft')
    router
      .post('/employees/:id/exercises/values/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.values.result')
    router
      .post('/employees/:id/exercises/personality/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.personality.draft')
    router
      .post('/employees/:id/exercises/personality/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.personality.result')
    router
      .post('/employees/:id/exercises/life_curve/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.life_curve.draft')
    router
      .post('/employees/:id/exercises/life_curve/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.life_curve.result')
    router
      .post('/employees/:id/exercises/targeting/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.targeting.draft')
    router
      .post('/employees/:id/exercises/targeting/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.targeting.result')
    router
      .post('/employees/:id/exercises/disc/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.disc.draft')
    router
      .post('/employees/:id/exercises/disc/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.disc.result')
    router
      .post('/employees/:id/exercises/skill_mapping/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.skill_mapping.draft')
    router
      .post('/employees/:id/exercises/skill_mapping/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.skill_mapping.result')
    router
      .post('/employees/:id/exercises/circle_of_control/draft', [
        ExerciseResultsController,
        'saveDraftFromDashboard',
      ])
      .as('dashboard.exercises.circle_of_control.draft')
    router
      .post('/employees/:id/exercises/circle_of_control/result', [
        ExerciseResultsController,
        'storeFromDashboard',
      ])
      .as('dashboard.exercises.circle_of_control.result')

    router.put('/settings/organization', [OrganizationsController, 'updateFromDashboard'])
    router.post('/settings/organization/advisors', [
      OrganizationsController,
      'storeAdvisorFromDashboard',
    ])

    router.get('/settings', [OrganizationsController, 'settingsDashboard'])
    // @ts-expect-error Inertia page name from generated types
    router.on('/design-system').renderInertia('dashboard/DesignSystem', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/profile').renderInertia('dashboard/Profile', {})

    router.get('/exercises/:type', [ExerciseResultsController, 'showDashboardConseillerExerciseSelf'])
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller')

// Super admin only dashboard routes
router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/SuperAdminHome', {})
    router.get('/organizations', [SuperAdminController, 'organizations'])
    router.post('/organizations', [SuperAdminController, 'storeOrganization'])
    router.delete('/organizations/:id', [SuperAdminController, 'destroyOrganization'])
    router.get('/users', [SuperAdminController, 'users'])
    router.post('/users/:id/role', [SuperAdminController, 'updateUserRole'])
    router.get('/exercises-usage', [SuperAdminController, 'exerciseUsage'])
    router.get('/exercises-usage/export', [SuperAdminController, 'exerciseUsageExport'])
  })
  .prefix('/dashboard/super-admin')
  .use([middleware.auth(), middleware.admin()])

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
