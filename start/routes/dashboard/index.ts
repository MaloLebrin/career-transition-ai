import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const DashboardController = () => import('#controllers/dashboard_controller')

// Dashboard entry: redirect to role-specific area
router
  .group(() => {
    router.get('/', [DashboardController, 'index'])
  })
  .use([middleware.auth()])
  .prefix('/dashboard')
