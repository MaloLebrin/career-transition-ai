import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const OrganizationsController = () => import('#controllers/organizations_controller')
const OrganizationLogosController = () => import('#controllers/organization_logos_controller')

/**
 * Settings — lecture ouverte aux conseillers, mutations du cabinet (infos,
 * logo, invitations) réservées aux administrateurs.
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
      .use(middleware.admin())
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller/settings')
