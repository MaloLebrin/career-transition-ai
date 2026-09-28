import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Content-Security-Policy (#67). Scripts : même origine + nonce par requête
   * (`cspNonce`, passé à `@vite` / `@viteReactRefresh` dans le layout Edge).
   * Styles inline autorisés : attributs `style` de React et barre de
   * progression d'Inertia. Origines externes : Google Fonts, logos Cloudinary,
   * avatars DiceBear de la landing. En dev, websocket HMR de Vite.
   */
  csp: {
    enabled: true,
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`, '@nonce', ...(app.inDev ? ['@viteUrl'] : [])],
      styleSrc: [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      fontSrc: [`'self'`, 'data:', 'https://fonts.gstatic.com'],
      imgSrc: [
        `'self'`,
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://api.dicebear.com',
      ],
      connectSrc: [`'self'`, ...(app.inDev ? ['ws:', 'wss:', '@viteUrl'] : [])],
      workerSrc: [`'self'`, 'blob:'],
      manifestSrc: [`'self'`],
      objectSrc: [`'none'`],
      baseUri: [`'self'`],
      formAction: [`'self'`],
      frameAncestors: [`'none'`],
    },
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: !app.inTest,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '365 days',
    includeSubDomains: true,
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
