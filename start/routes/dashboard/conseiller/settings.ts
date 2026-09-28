import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const OrganizationsController = () => import('#controllers/organizations_controller')
const OrganizationLogosController = () => import('#controllers/organization_logos_controller')

/**
 * Settings
 */
router
  .group(() => {
    router.get('/', [OrganizationsController, 'settingsDashboard'])

    router
      .group(() => {
        router.put('/', [OrganizationsController, 'updateFromDashboard'])
        router.post('/advisors', [OrganizationsController, 'storeAdvisorFromDashboard'])
        router.post('/logo', [OrganizationLogosController, 'store'])
        router.delete('/logo', [OrganizationLogosController, 'destroy'])
      })
      .prefix('/organization')
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller/settings')
