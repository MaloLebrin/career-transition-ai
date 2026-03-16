
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const EducationController = () => import('#controllers/educations_controller')

router
  .group(() => {
    router.post('/', [EducationController, 'store']).as('educations.store')
    router.put('/', [EducationController, 'update']).as('educations.update')
    router.delete('/', [EducationController, 'delete']).as('educations.delete')
  })
  .use(middleware.auth())
  .prefix('/dashboard/candidat/educations')
