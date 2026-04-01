import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const SuperAdminController = () => import('#controllers/super_admin_controller')

// Super admin only dashboard routes
router
  .group(() => {
    router.get('/', [SuperAdminController, 'home'])
    router.get('/organizations', [SuperAdminController, 'organizations'])
    router.post('/organizations', [SuperAdminController, 'storeOrganization'])
    router.delete('/organizations/:id', [SuperAdminController, 'destroyOrganization'])
    router.get('/users', [SuperAdminController, 'users'])
    router.post('/users', [SuperAdminController, 'storeUser'])
    router.post('/users/:id/role', [SuperAdminController, 'updateUserRole'])
    router.post('/users/:id/resend-onboarding', [SuperAdminController, 'resendUserOnboarding'])
    router.get('/exercises-usage', [SuperAdminController, 'exerciseUsage'])
    router.get('/exercises-usage/export', [SuperAdminController, 'exerciseUsageExport'])
    // @ts-expect-error Inertia page name from generated types
    router.on('/bulk-jobs').renderInertia('dashboard/admin/jobs/Index', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/design-system').renderInertia('dashboard/admin/DesignSystem', {})
  })
  .prefix('/dashboard/super-admin')
  .use([middleware.auth(), middleware.superAdmin()])
