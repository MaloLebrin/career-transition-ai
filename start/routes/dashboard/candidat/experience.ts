import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ExperienceController = () => import('#controllers/experiences_controller')

router
  .group(() => {
    router.post('/', [ExperienceController, 'store']).as('experiences.store')
    router.put('/', [ExperienceController, 'update']).as('experiences.update')
    router.delete('/', [ExperienceController, 'delete']).as('experiences.delete')
  })
  .use(middleware.auth())
  .prefix('/dashboard/candidat/experiences')
