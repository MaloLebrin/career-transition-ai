import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

// Server-Sent Events (Transmit) routes, protected by auth
transmit.registerRoutes((route) => {
  route.middleware(middleware.auth())
})
