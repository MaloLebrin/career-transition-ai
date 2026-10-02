import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const SuperAdminController = () => import('#controllers/super_admin_controller')
const PdfExportsController = () => import('#controllers/pdf_exports_controller')
const SuperAdminExpertRequestsController = () =>
  import('#controllers/super_admin_expert_requests_controller')
const SuperAdminBillingController = () => import('#controllers/super_admin_billing_controller')

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
    router.get('/pdf-exports', [PdfExportsController, 'index']).as('super_admin.pdf_exports')
    router.on('/design-system').renderInertia('dashboard/admin/DesignSystem', {})
    // Demandes d'accompagnement et équipe interne (#105)
    router
      .get('/expert-requests', [SuperAdminExpertRequestsController, 'index'])
      .as('super_admin.expert_requests.index')
    router
      .post('/expert-requests/:id/assign', [SuperAdminExpertRequestsController, 'assign'])
      .as('super_admin.expert_requests.assign')
    router
      .post('/expert-requests/:id/decline', [SuperAdminExpertRequestsController, 'decline'])
      .as('super_admin.expert_requests.decline')
    router.get('/team', [SuperAdminExpertRequestsController, 'team']).as('super_admin.team.index')
    router
      .post('/team', [SuperAdminExpertRequestsController, 'invite'])
      .as('super_admin.team.invite')
    // Particuliers et paiements du forfait (#107)
    router.get('/b2c', [SuperAdminBillingController, 'candidates']).as('super_admin.b2c.index')
    router
      .post('/b2c/:employeeId/entitlement/grant', [SuperAdminBillingController, 'grant'])
      .as('super_admin.b2c.grant')
    router.get('/payments', [SuperAdminBillingController, 'index']).as('super_admin.payments.index')
    router
      .post('/payments/:id/revoke', [SuperAdminBillingController, 'revoke'])
      .as('super_admin.payments.revoke')
  })
  .prefix('/dashboard/super-admin')
  .use([middleware.auth(), middleware.superAdmin()])
