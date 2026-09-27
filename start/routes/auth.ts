import { middleware } from '#start/kernel'
import { throttleLogin, throttleRegister } from '#start/limiter'
import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')

router.get('/auth', ({ response }) => response.redirect('/auth/login'))

// Auth JSON API
router
  .group(() => {
    router.post('/login', [AuthController, 'login']).use(throttleLogin)
    router
      .post('/register', [AuthController, 'register'])
      .use([throttleRegister, middleware.registrationOpen()])
    router.post('/logout', [AuthController, 'logout'])
    router
      .group(() => {
        router.post('/impersonate/:id', [AuthController, 'impersonate'])
        router.post('/reset-password/:id', [AuthController, 'resetPassword'])
      })
      .use([middleware.auth(), middleware.superAdmin()])
  })
  .prefix('/auth')
