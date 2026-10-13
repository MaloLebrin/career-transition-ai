import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const OrganizationsController = () => import('#controllers/organizations_controller')
const OrganizationTeamController = () => import('#controllers/organization_team_controller')
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
        router.put('/members/:id/role', [OrganizationTeamController, 'updateRole'])
        router.post('/members/:id/disable', [OrganizationTeamController, 'disable'])
        router.post('/members/:id/enable', [OrganizationTeamController, 'enable'])
        router.post('/members/:id/reassign', [OrganizationTeamController, 'reassign'])
        router.post('/logo', [OrganizationLogosController, 'store'])
        router.delete('/logo', [OrganizationLogosController, 'destroy'])
      })
      .prefix('/organization')
      .use(middleware.admin())
  })
  .use([middleware.auth(), middleware.advisorOrAdmin()])
  .prefix('/dashboard/conseiller/settings')
