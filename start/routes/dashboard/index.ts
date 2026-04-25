import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const DashboardController = () => import('#controllers/dashboard_controller')
const PdfExportDownloadsController = () => import('#controllers/pdf_export_downloads_controller')

// Dashboard entry: redirect to role-specific area
router
  .group(() => {
    router.get('/', [DashboardController, 'index'])
    router.get('/pdf-exports/:id/download', [PdfExportDownloadsController, 'show'])
  })
  .use([middleware.auth()])
  .prefix('/dashboard')
