import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const SuperAdminController = () => import('#controllers/super_admin_controller')

// Super admin only dashboard routes
router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('dashboard/SuperAdminHome', {})
    router.get('/organizations', [SuperAdminController, 'organizations'])
    router.post('/organizations', [SuperAdminController, 'storeOrganization'])
    router.delete('/organizations/:id', [SuperAdminController, 'destroyOrganization'])
    router.get('/users', [SuperAdminController, 'users'])
    router.post('/users/:id/role', [SuperAdminController, 'updateUserRole'])
    router.get('/exercises-usage', [SuperAdminController, 'exerciseUsage'])
    router.get('/exercises-usage/export', [SuperAdminController, 'exerciseUsageExport'])
    // @ts-expect-error Inertia page name from generated types
    router.on('/bulk-jobs').renderInertia('dashboard/BulkJobs', {})
  })
  .prefix('/dashboard/super-admin')
  .use([middleware.auth(), middleware.admin()])
