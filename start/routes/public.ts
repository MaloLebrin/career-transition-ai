import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    // @ts-expect-error Inertia page name from generated types
    router.on('/').renderInertia('Landing', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/methodologie').renderInertia('Methodology', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/offre').renderInertia('Offer', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/tarifs').renderInertia('Pricing', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/mentions-legales').renderInertia('LegalNotice', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/confidentialite').renderInertia('PrivacyPolicy', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/securite').renderInertia('Security', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/login').renderInertia('Login', {})
    // @ts-expect-error Inertia page name from generated types
    router.on('/auth/register').renderInertia('Register', {})
  })
  .use([middleware.guest()])
