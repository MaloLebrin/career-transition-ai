import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ExpertRequestsController = () => import('#controllers/expert_requests_controller')

/** Demande d'accompagnement par un expert (#103) : réservée aux candidats onboardés. */
router
  .group(() => {
    router
      .get('/accompagnement', [ExpertRequestsController, 'index'])
      .as('candidat.expertRequests.index')
    router
      .post('/expert-requests', [ExpertRequestsController, 'store'])
      .as('candidat.expertRequests.store')
  })
  .use([middleware.auth(), middleware.candidate(), middleware.checkOnboarding()])
  .prefix('/dashboard/candidat')
