import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const DashboardController = () => import('#controllers/dashboard_controller')
const BulkJobDownloadsController = () => import('#controllers/bulk_job_downloads_controller')

// Dashboard entry: redirect to role-specific area
router
  .group(() => {
    router.get('/', [DashboardController, 'index'])
    router.get('/bulk-jobs/:id/download', [BulkJobDownloadsController, 'show'])
  })
  .use([middleware.auth()])
  .prefix('/dashboard')
