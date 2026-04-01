import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const NotesController = () => import('#controllers/notes_controller')
const BulkJobsController = () => import('#controllers/bulk_jobs_controller')

// Dashboard conseiller (advisor, admin, super_admin)
router
  .group(() => {
    /**
     * General routes
     */
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/conseiller/home/Home') // TODO put in his controller
    // @ts-expect-error Inertia page name from generated types
    router.on('/profile').renderInertia('dashboard/conseiller/profile/Home', {}) // TODO put in his controller
    router.put('/profile', [AuthController, 'updateFromDashboard'])
    router.get('/bulk-jobs', [BulkJobsController, 'index'])

    /**
     * Notes management (update/delete)
     */
    router.put('/notes/:id', [NotesController, 'update'])
    router.delete('/notes/:id', [NotesController, 'destroy'])

    router.get('/exercises/:type', [
      ExerciseResultsController,
      'showDashboardConseillerExerciseSelf',
    ])
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller')
