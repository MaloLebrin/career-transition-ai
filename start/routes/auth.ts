import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const AuthController = () => import('#controllers/auth_controller')

// Public / auth pages
// @ts-expect-error Inertia page name from generated types
router.on('/').renderInertia('Landing', {})
// @ts-expect-error Inertia page name from generated types
router.on('/methodologie').renderInertia('Methodology', {})
// @ts-expect-error Inertia page name from generated types
router.on('/offre').renderInertia('Offer', {})
// @ts-expect-error Inertia page name from generated types
router.on('/mentions-legales').renderInertia('LegalNotice', {})
// @ts-expect-error Inertia page name from generated types
router.on('/confidentialite').renderInertia('PrivacyPolicy', {})
// @ts-expect-error Inertia page name from generated types
router.on('/securite').renderInertia('Security', {})

// Auth pages: guest middleware redirects already-logged-in users to /dashboard
router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/login').renderInertia('Login', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/register').renderInertia('Register', {})
  })
  .use([middleware.guest()])

router.get('/auth', ({ response }) => response.redirect('/auth/login'))

// Auth JSON API
router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/impersonate/:id', [AuthController, 'impersonate'])
    router.post('/reset-password/:id', [AuthController, 'resetPassword'])
  })
  .prefix('/auth')
