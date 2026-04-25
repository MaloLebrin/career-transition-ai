import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ContactRequestsController = () => import('#controllers/contact_requests_controller')

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
    router.on('/auth/register').renderInertia('Register', {})
  })
  .use([middleware.guest()])

router.post('/contact-requests', [ContactRequestsController, 'store'])
