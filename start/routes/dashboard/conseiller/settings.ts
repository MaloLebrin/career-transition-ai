import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const OrganizationsController = () => import('#controllers/organizations_controller')

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
      })
      .prefix('/organization')
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller/settings')
