import { http as httpConfig } from '#config/app'
import { clientIp } from '#utils/client_ip'
import { RequestFactory } from '@adonisjs/core/factories/http'
import { test } from '@japa/runner'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'

/**
 * Clé IP du rate limiting (`start/limiter.ts`) : ne doit pas dépendre de ce que
 * le client écrit dans `X-Forwarded-For`.
 */
function requestFrom(remoteAddress: string, headers: Record<string, string> = {}) {
  const socket = new Socket()
  Object.defineProperty(socket, 'remoteAddress', { value: remoteAddress })
  const req = new IncomingMessage(socket)
  req.headers = headers
  return new RequestFactory().merge({ url: '/', method: 'POST', config: httpConfig, req }).create()
}

test.group('clientIp', () => {
  test('sans X-Forwarded-For : adresse de la connexion', ({ assert }) => {
    assert.equal(clientIp(requestFrom('10.0.0.21')), '10.0.0.21')
  })

  test('une seule entrée : celle posée par le proxy', ({ assert }) => {
    const request = requestFrom('10.0.0.22', { 'x-forwarded-for': '203.0.113.9' })

    assert.equal(clientIp(request), '203.0.113.9')
  })

  test('plusieurs entrées : la plus à droite, et non celle écrite par le client', ({ assert }) => {
    const request = requestFrom('10.0.0.23', {
      'x-forwarded-for': '198.51.100.1, 198.51.100.2 , 203.0.113.9',
    })

    // `request.ip()` renverrait l'entrée de gauche, falsifiable.
    assert.equal(request.ip(), '198.51.100.1')
    assert.equal(clientIp(request), '203.0.113.9')
  })

  test('en-tête vide ou mal formé : repli sur request.ip()', ({ assert }) => {
    assert.equal(clientIp(requestFrom('10.0.0.24', { 'x-forwarded-for': ' , ' })), '10.0.0.24')
  })
})
