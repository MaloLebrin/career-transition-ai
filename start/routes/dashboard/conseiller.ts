import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const DashboardController = () => import('#controllers/dashboard_controller')
const AuthController = () => import('#controllers/auth_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const NotesController = () => import('#controllers/notes_controller')
const PdfExportsController = () => import('#controllers/pdf_exports_controller')

// Dashboard conseiller (advisor, admin, super_admin)
router
  .group(() => {
    /**
     * General routes
     */
    router.get('/', [DashboardController, 'advisorHome'])
    // Le profil (nom, e-mail, mot de passe) se modifie dans les réglages.
    router.get('/profile', ({ response }) => response.redirect('/dashboard/conseiller/settings'))
    router.put('/profile', [AuthController, 'updateFromDashboard'])
    router.get('/pdf-exports', [PdfExportsController, 'index']).as('pdf_exports.index')

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
