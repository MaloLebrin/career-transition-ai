import { middleware } from '#start/kernel'
import { throttleDataExport, throttleEmailVerification } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const EmployeesController = () => import('#controllers/employees_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const AuthController = () => import('#controllers/auth_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const CandidatOnboardingController = () => import('#controllers/candidat_onboarding_controller')
const EmployeeSynthesesController = () => import('#controllers/employee_syntheses_controller')
const CandidateDocumentsController = () => import('#controllers/candidate_documents_controller')
const CandidateDataController = () => import('#controllers/candidate_data_controller')
const EmailVerificationController = () => import('#controllers/email_verification_controller')

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
        router.get('/synthesis', [EmployeeSynthesesController, 'showCandidate'])
        router.post('/synthesis/pdf', [
          EmployeeSynthesesController,
          'generateShareablePdfCandidate',
        ])
        router
          .post('/documents', [CandidateDocumentsController, 'store'])
          .as('candidat.documents.store')
        router
          .get('/documents/:mediaId', [CandidateDocumentsController, 'download'])
          .where('mediaId', router.matchers.number())
          .as('candidat.documents.download')
        router
          .delete('/documents/:mediaId', [CandidateDocumentsController, 'destroy'])
          .where('mediaId', router.matchers.number())
          .as('candidat.documents.destroy')
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
    // Droits RGPD en libre-service (#70)
    router
      .get('/data/export', [CandidateDataController, 'export'])
      .use(throttleDataExport)
      .as('candidat.data.export')
    router
      .post('/data/erasure-request', [CandidateDataController, 'requestErasure'])
      .as('candidat.data.erasureRequest')
    // Renvoi du lien de vérification d'e-mail (#98), sans attendre l'onboarding.
    router
      .post('/email-verification/resend', [EmailVerificationController, 'resend'])
      .use(throttleEmailVerification)
      .as('candidat.emailVerification.resend')
    router.post('/skills', [() => import('#controllers/employee_skills_controller'), 'store'])
    router.put('/skills', [() => import('#controllers/employee_skills_controller'), 'update'])
  })
  .use([middleware.auth(), middleware.candidate()])
  .prefix('/dashboard/candidat')
