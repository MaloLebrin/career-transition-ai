import { middleware } from '#start/kernel'
import { throttleContactRequests } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const ContactRequestsController = () => import('#controllers/contact_requests_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')

router
  .group(() => {
    router.on('/').renderInertia('home', {})
    router.on('/methodologie').renderInertia('Methodology', {})
    router.on('/offre').renderInertia('Offer', {})
    router.on('/tarifs').renderInertia('Pricing', {})
    router.on('/mentions-legales').renderInertia('LegalNotice', {})
    router.on('/confidentialite').renderInertia('PrivacyPolicy', {})
    router.on('/securite').renderInertia('Security', {})
    router.on('/auth/login').renderInertia('Login', {})
    router.on('/auth/register').renderInertia('Register', {}).use(middleware.registrationOpen())
  })
  .use([middleware.guest()])

router.post('/contact-requests', [ContactRequestsController, 'store']).use(throttleContactRequests)

// Hors du groupe `guest` : sondé sans session par Docker, Render, UptimeRobot…
router.get('/health', [HealthChecksController])
