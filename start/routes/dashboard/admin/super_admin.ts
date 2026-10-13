import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const SuperAdminController = () => import('#controllers/super_admin_controller')
const PdfExportsController = () => import('#controllers/pdf_exports_controller')
const SuperAdminExpertRequestsController = () =>
  import('#controllers/super_admin_expert_requests_controller')
const SuperAdminContactRequestsController = () =>
  import('#controllers/super_admin_contact_requests_controller')
const SuperAdminSkillsController = () => import('#controllers/super_admin_skills_controller')
const SuperAdminBillingController = () => import('#controllers/super_admin_billing_controller')

// Super admin only dashboard routes
router
  .group(() => {
    router.get('/', [SuperAdminController, 'home'])
    router.get('/organizations', [SuperAdminController, 'organizations'])
    router.post('/organizations', [SuperAdminController, 'storeOrganization'])
    router
      .get('/organizations/:id', [SuperAdminController, 'showOrganization'])
      .where('id', router.matchers.number())
    router
      .put('/organizations/:id', [SuperAdminController, 'updateOrganization'])
      .where('id', router.matchers.number())
    router
      .delete('/organizations/:id', [SuperAdminController, 'destroyOrganization'])
      .where('id', router.matchers.number())
    router.get('/users', [SuperAdminController, 'users'])
    router.post('/users', [SuperAdminController, 'storeUser'])
    router
      .put('/users/:id', [SuperAdminController, 'updateUser'])
      .where('id', router.matchers.number())
    router
      .delete('/users/:id', [SuperAdminController, 'destroyUser'])
      .where('id', router.matchers.number())
    router
      .post('/users/:id/disable', [SuperAdminController, 'disableUser'])
      .where('id', router.matchers.number())
    router
      .post('/users/:id/enable', [SuperAdminController, 'enableUser'])
      .where('id', router.matchers.number())
    router
      .post('/users/:id/role', [SuperAdminController, 'updateUserRole'])
      .where('id', router.matchers.number())
    router
      .post('/users/:id/resend-onboarding', [SuperAdminController, 'resendUserOnboarding'])
      .where('id', router.matchers.number())
    // Demandes de contact et catalogue de compétences (#73)
    router.get('/contact-requests', [SuperAdminContactRequestsController, 'index'])
    router
      .post('/contact-requests/:id/status', [SuperAdminContactRequestsController, 'updateStatus'])
      .where('id', router.matchers.number())
    router.get('/skills', [SuperAdminSkillsController, 'index'])
    router.post('/skills', [SuperAdminSkillsController, 'store'])
    router
      .put('/skills/:id', [SuperAdminSkillsController, 'update'])
      .where('id', router.matchers.number())
    router
      .delete('/skills/:id', [SuperAdminSkillsController, 'destroy'])
      .where('id', router.matchers.number())
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
      .where('id', router.matchers.number())
      .as('super_admin.expert_requests.assign')
    router
      .post('/expert-requests/:id/decline', [SuperAdminExpertRequestsController, 'decline'])
      .where('id', router.matchers.number())
      .as('super_admin.expert_requests.decline')
    router.get('/team', [SuperAdminExpertRequestsController, 'team']).as('super_admin.team.index')
    router
      .post('/team', [SuperAdminExpertRequestsController, 'invite'])
      .as('super_admin.team.invite')
    // Particuliers et paiements du forfait (#107)
    router.get('/b2c', [SuperAdminBillingController, 'candidates']).as('super_admin.b2c.index')
    router
      .post('/b2c/:employeeId/entitlement/grant', [SuperAdminBillingController, 'grant'])
      .where('employeeId', router.matchers.number())
      .as('super_admin.b2c.grant')
    router.get('/payments', [SuperAdminBillingController, 'index']).as('super_admin.payments.index')
    router
      .post('/payments/:id/revoke', [SuperAdminBillingController, 'revoke'])
      .where('id', router.matchers.number())
      .as('super_admin.payments.revoke')
  })
  .prefix('/dashboard/super-admin')
  .use([middleware.auth(), middleware.superAdmin()])
