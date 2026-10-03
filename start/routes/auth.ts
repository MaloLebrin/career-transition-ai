import { middleware } from '#start/kernel'
import {
  throttleChangePassword,
  throttleForgotPassword,
  throttleLogin,
  throttleOnboarding,
  throttlePasswordReset,
  throttleRegister,
} from '#start/limiter'
import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')
const PasswordsController = () => import('#controllers/passwords_controller')
const EmailVerificationController = () => import('#controllers/email_verification_controller')

router.get('/auth', ({ response }) => response.redirect('/auth/login'))

// Auth JSON API
router
  .group(() => {
    router.post('/login', [AuthController, 'login']).use(throttleLogin)
    router
      .post('/register', [AuthController, 'register'])
      .use([throttleRegister, middleware.registrationOpen()])
    // Particuliers (#93) : même quota d'inscriptions par IP, flag distinct.
    router
      .post('/register/candidat', [AuthController, 'registerCandidate'])
      .use([throttleRegister, middleware.registrationOpen({ kind: 'candidate' })])
    router.post('/logout', [AuthController, 'logout'])
    router
      .group(() => {
        router.post('/impersonate/:id', [AuthController, 'impersonate'])
        router.post('/reset-password/:id', [PasswordsController, 'sendResetLink'])
      })
      .use([middleware.auth(), middleware.superAdmin()])
  })
  .prefix('/auth')

// Mot de passe oublié (#68) : invités uniquement. GET et POST du lien partagent
// le quota `throttlePasswordReset` : tous deux permettent de tester un jeton.
router
  .group(() => {
    router.get('/forgot-password', [PasswordsController, 'showForgot'])
    router.post('/forgot-password', [PasswordsController, 'sendForgot']).use(throttleForgotPassword)
    router
      .group(() => {
        router.get('/:token', [PasswordsController, 'showReset'])
        router.post('/:token', [PasswordsController, 'reset'])
      })
      .prefix('/password-reset')
      .use(throttlePasswordReset)
  })
  .prefix('/auth')
  .use(middleware.guest())

// Changement de mot de passe (#68) : tout utilisateur connecté.
router
  .put('/dashboard/password', [PasswordsController, 'update'])
  .use([middleware.auth(), throttleChangePassword])

// Vérification d'e-mail (#98) : lien cliqué depuis la boîte mail, connecté ou
// non (`silentAuth`), même quota que l'énumération des jetons d'onboarding.
router
  .get('/auth/verify-email/:token', [EmailVerificationController, 'verify'])
  .use([middleware.silentAuth(), throttleOnboarding])
