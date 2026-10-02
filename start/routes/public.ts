import { middleware } from '#start/kernel'
import { throttleContactRequests } from '#start/limiter'
import router from '@adonisjs/core/services/router'

const ContactRequestsController = () => import('#controllers/contact_requests_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')
const RobotsController = () => import('#controllers/robots_controller')

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
    router
      .on('/inscription')
      .renderInertia('RegisterCandidate', {})
      .use(middleware.registrationOpen({ kind: 'candidate' }))
  })
  .use([middleware.guest()])

router.post('/contact-requests', [ContactRequestsController, 'store']).use(throttleContactRequests)

// Hors du groupe `guest` : les conditions se relisent connecté (case CGU de
// l'inscription, consentements du paiement, lien du pied de page). `silentAuth`
// expose l'utilisateur connecté aux props partagées sans jamais refuser l'accès.
router
  .group(() => {
    router.on('/cgu').renderInertia('TermsOfService', {})
    router.on('/cgv').renderInertia('TermsOfSale', {})
  })
  .use([middleware.silentAuth()])

// Hors du groupe `guest` : sondé sans session par Docker, Render, UptimeRobot…
router.get('/health', [HealthChecksController])

// Hors du groupe `guest` : un robot n'a pas de session, et le fichier ne doit
// jamais rediriger. Pas de `public/robots.txt` : il ne suivrait pas SEO_INDEXING.
router.get('/robots.txt', [RobotsController])
