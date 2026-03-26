import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const EmployeesController = () => import('#domains/employees/http/employees_controller')
const DashboardController = () => import('#domains/dashboard/http/dashboard_controller')
const AuthController = () => import('#domains/auth/http/auth_controller')
const ExerciseResultsController = () => import('#domains/exercises/http/exercise_results_controller')
const CandidatOnboardingController = () => import('#domains/onboarding/http/candidat_onboarding_controller')

// Dashboard candidat (employee only)
router
  .group(() => {
    // Routes requiring onboarding
    router
      .group(() => {
        router.get('/', [DashboardController, 'candidatHome'])
        router
          .get('/profile', [EmployeesController, 'showProfileDashboard'])
          .as('dashboardEmployeeProfile')
        router.get('/steps/:stepId', [EmployeesController, 'showStepDetailCandidat'])
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
      .use(middleware.checkOnboarding())

    // Routes not requiring onboarding
    router.get('/onboarding', [DashboardController, 'candidatOnboarding'])
    router.put('/onboarding', [CandidatOnboardingController, 'complete'])
    router.put('/profile', [AuthController, 'updateProfileCandidat'])
    router.post('/skills', [() => import('#domains/skills/http/employee_skills_controller'), 'store'])
    router.put('/skills', [() => import('#domains/skills/http/employee_skills_controller'), 'update'])
  })
  .use([middleware.auth(), middleware.candidate()])
  .prefix('/dashboard/candidat')
