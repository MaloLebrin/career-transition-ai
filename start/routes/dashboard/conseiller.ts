import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const AuthController = () => import('#controllers/auth_controller')
const EmployeesController = () => import('#controllers/employees_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')

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

    router.get('/exercises/:type', [
      ExerciseResultsController,
      'showDashboardConseillerExerciseSelf',
    ])
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller')
