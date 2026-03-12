import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const EmployeesController = () => import('#controllers/employees_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')
const BulkJobsController = () => import('#controllers/bulk_jobs_controller')

// Dashboard conseiller (advisor, admin, super_admin)
router
  .group(() => {
    /**
     * General routes
     */
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/ConseillerHome')
    // @ts-expect-error Inertia page name from generated types
    router.on('/design-system').renderInertia('dashboard/DesignSystem', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/profile').renderInertia('dashboard/ConseillerProfile', {})
    router.put('/profile', [AuthController, 'updateFromDashboard'])
    router.get('/bulk-jobs', [BulkJobsController, 'index'])
    router.put('/settings/organization', [OrganizationsController, 'updateFromDashboard'])

    router.get('/exercises/:type', [
      ExerciseResultsController,
      'showDashboardConseillerExerciseSelf',
    ])

    /**
     * Employees management
     */
    router
      .group(() => {
        router.get('/', [EmployeesController, 'indexDashboard'])
        router.post('/', [EmployeesController, 'storeFromDashboard'])

        router
          .group(() => {
            router.get('/', [EmployeesController, 'showDashboard'])
            router.put('/', [EmployeesController, 'updateFromDashboard'])
            router.get('/profile', [EmployeesController, 'showProfileDashboard'])
            router.get('/dossier', [EmployeesController, 'downloadDossier'])

            /**
             * Employee Exercises
             */
            router
              .group(() => {
                router.get('/', [ExerciseResultsController, 'exerciseListConseiller'])
                router.get('/results/:type', [
                  ExerciseResultsController,
                  'showExerciseResultConseiller',
                ])
                router.get('/:type', [ExerciseResultsController, 'showDashboard'])

                // Exercise submissions (Motivation)
                router
                  .post('/motivation/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.motivation.draft')
                router
                  .post('/motivation/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.motivation.result')

                // Exercise submissions (Values)
                router
                  .post('/values/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.values.draft')
                router
                  .post('/values/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.values.result')

                // Exercise submissions (Personality)
                router
                  .post('/personality/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.personality.draft')
                router
                  .post('/personality/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.personality.result')

                // Exercise submissions (Life Curve)
                router
                  .post('/life_curve/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.life_curve.draft')
                router
                  .post('/life_curve/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.life_curve.result')

                // Exercise submissions (Targeting)
                router
                  .post('/targeting/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.targeting.draft')
                router
                  .post('/targeting/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.targeting.result')

                // Exercise submissions (DISC)
                router
                  .post('/disc/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
                  .as('dashboard.exercises.disc.draft')
                router
                  .post('/disc/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.disc.result')

                // Exercise submissions (Skill Mapping)
                router
                  .post('/skill_mapping/draft', [
                    ExerciseResultsController,
                    'saveDraftFromDashboard',
                  ])
                  .as('dashboard.exercises.skill_mapping.draft')
                router
                  .post('/skill_mapping/result', [ExerciseResultsController, 'storeFromDashboard'])
                  .as('dashboard.exercises.skill_mapping.result')

                // Exercise submissions (Circle of Control)
                router
                  .post('/circle_of_control/draft', [
                    ExerciseResultsController,
                    'saveDraftFromDashboard',
                  ])
                  .as('dashboard.exercises.circle_of_control.draft')
                router
                  .post('/circle_of_control/result', [
                    ExerciseResultsController,
                    'storeFromDashboard',
                  ])
                  .as('dashboard.exercises.circle_of_control.result')
              })
              .prefix('/exercises')
          })
          .prefix('/:id')
      })
      .prefix('/employees')

    /**
     * Settings
     */
    router
      .group(() => {
        router.get('/', [OrganizationsController, 'settingsDashboard'])

        router
          .group(() => {
            router.put('/', [OrganizationsController, 'updateFromDashboard'])
            router.post('/advisors', [OrganizationsController, 'storeAdvisorFromDashboard'])
          })
          .prefix('/organization')
      })
      .prefix('/settings')
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller')
