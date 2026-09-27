import { http as httpConfig } from '#config/app'
import transmitConfig from '#config/transmit'
import { defineConfig as defineHttpConfig } from '@adonisjs/core/http'
import { RequestFactory } from '@adonisjs/core/factories/http'
import { test } from '@japa/runner'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'

/**
 * Garde de la configuration « derrière un reverse proxy ».
 *
 * L'app est toujours exposée derrière un proxy qui termine le TLS (Caddy,
 * Render, Koyeb, Tailscale Funnel…). Avec le `trustProxy` par défaut
 * d'AdonisJS (`loopback`), `request.protocol()` renvoie `http` pour toute
 * requête relayée depuis une IP non locale : les liens d'onboarding construits
 * avec `${request.protocol()}://${request.hostname()}` partent en `http://`.
 *
 * Non-régression de l'issue #13.
 */

/**
 * IPs de proxys hors loopback, telles que vues par le serveur Node. Une IP
 * différente par test : AdonisJS met en cache le verdict `trustProxy` par
 * adresse, un même `remoteAddress` partagerait son résultat entre les tests.
 */
const PROXY_IP = '10.0.0.7'
const CONTROL_PROXY_IP = '10.0.0.8'

function forwardedRequest(headers: Record<string, string>, remoteAddress: string): IncomingMessage {
  const socket = new Socket()
  Object.defineProperty(socket, 'remoteAddress', { value: remoteAddress })
  const req = new IncomingMessage(socket)
  req.headers = headers
  return req
}

test.group('Hygiène — reverse proxy et SSE', () => {
  test('les en-têtes X-Forwarded-* d’un proxy hors loopback sont honorés', ({ assert }) => {
    const request = new RequestFactory()
      .merge({
        url: '/dashboard',
        method: 'GET',
        config: httpConfig,
        req: forwardedRequest(
          {
            'host': '127.0.0.1:8080',
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'app.example.test',
            'x-forwarded-for': '203.0.113.9',
          },
          PROXY_IP
        ),
      })
      .create()

    assert.equal(request.protocol(), 'https')
    assert.equal(request.hostname(), 'app.example.test')
    assert.equal(request.ip(), '203.0.113.9')
    assert.equal(`${request.protocol()}://${request.hostname()}`, 'https://app.example.test')
  })

  test('contrôle : avec le trustProxy par défaut (loopback) le lien serait en http://', ({
    assert,
  }) => {
    const request = new RequestFactory()
      .merge({
        url: '/dashboard',
        method: 'GET',
        config: defineHttpConfig({}),
        req: forwardedRequest(
          {
            'host': '127.0.0.1:8080',
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'app.example.test',
          },
          CONTROL_PROXY_IP
        ),
      })
      .create()

    assert.equal(request.protocol(), 'http')
    assert.equal(request.hostname(), '127.0.0.1')
  })

  test('les connexions SSE Transmit ont un keep-alive', ({ assert }) => {
    // Sans ping, les proxys coupent `/__transmit/events` après ~60–100 s d'inactivité.
    assert.equal(transmitConfig.pingInterval, '30s')
  })
})
