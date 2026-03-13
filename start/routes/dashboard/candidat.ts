import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const DashboardController = () => import('#controllers/dashboard_controller')
const AuthController = () => import('#controllers/auth_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')

// Dashboard candidat (employee only)
router
  .group(() => {
    router.get('/', [DashboardController, 'candidatHome'])
    router.get('/profile', ({ inertia }) =>
      (inertia as any).render('dashboard/CandidatProfile', {})
    )
    router.put('/profile', [AuthController, 'updateProfileCandidat'])
    router.get('/exercises', [ExerciseResultsController, 'exerciseListCandidat'])
    router.get('/exercises/:type', [ExerciseResultsController, 'showDashboardCandidat'])
    router.post('/exercises/:type/draft', [
      ExerciseResultsController,
      'saveDraftFromDashboardCandidat',
    ])
    router.post('/exercises/:type/result', [
      ExerciseResultsController,
      'storeFromDashboardCandidat',
    ])
  })
  .use([middleware.auth(), middleware.candidate()])
  .prefix('/dashboard/candidat')
