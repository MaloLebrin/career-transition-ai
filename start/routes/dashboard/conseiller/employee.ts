import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const EmployeesController = () => import('#controllers/employees_controller')
const SupportPlanStepsController = () => import('#controllers/support_plan_steps_controller')
const NotesController = () => import('#controllers/notes_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const EmployeeSynthesesController = () => import('#controllers/employee_syntheses_controller')
const CandidateDocumentsController = () => import('#controllers/candidate_documents_controller')

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
        router.post('/onboarding/resend', [EmployeesController, 'resendOnboardingLink'])
        router.get('/synthesis', [EmployeeSynthesesController, 'showAdvisor'])
        router.put('/synthesis', [EmployeeSynthesesController, 'updateAdvisor'])
        router.post('/synthesis/share', [EmployeeSynthesesController, 'share'])
        router.post('/synthesis/unshare', [EmployeeSynthesesController, 'unshare'])
        router.post('/synthesis/pdf', [EmployeeSynthesesController, 'generateShareablePdfAdvisor'])

        /**
         * Step Detail (Feuille de Route)
         */
        router.get('/steps/:stepId', [EmployeesController, 'showStepDetail'])

        /**
         * Support Plan Steps Management
         */
        router.post('/steps', [SupportPlanStepsController, 'store'])
        router.put('/steps/:stepId', [SupportPlanStepsController, 'update'])
        router.delete('/steps/:stepId', [SupportPlanStepsController, 'destroy'])
        router.post('/steps/:stepId/unlock', [SupportPlanStepsController, 'unlock'])
        router.post('/steps/:stepId/lock', [SupportPlanStepsController, 'lock'])

        /**
         * Employee Documents (Cloudinary, privés)
         */
        router
          .post('/documents', [CandidateDocumentsController, 'store'])
          .as('conseiller.employees.documents.store')
        router
          .get('/documents/:mediaId', [CandidateDocumentsController, 'download'])
          .where('mediaId', router.matchers.number())
          .as('conseiller.employees.documents.download')
        router
          .delete('/documents/:mediaId', [CandidateDocumentsController, 'destroy'])
          .where('mediaId', router.matchers.number())
          .as('conseiller.employees.documents.destroy')

        /**
         * Employee Notes
         */
        router.post('/notes', [NotesController, 'store'])

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
              .post('/skill_mapping/draft', [ExerciseResultsController, 'saveDraftFromDashboard'])
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
              .post('/circle_of_control/result', [ExerciseResultsController, 'storeFromDashboard'])
              .as('dashboard.exercises.circle_of_control.result')
          })
          .prefix('/exercises')
      })
      .prefix('/:id')
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller/employees')
