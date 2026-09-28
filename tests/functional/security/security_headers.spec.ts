import { PERMISSIONS_POLICY } from '#middleware/security_headers_middleware'
import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * En-têtes de sécurité des pages HTML (#67) : CSP à nonce, HSTS avec
 * sous-domaines, Permissions-Policy. Avant : CSP désactivée, pas de
 * Permissions-Policy, HSTS sans `includeSubDomains`.
 */
function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...values]) => [name, values])
  )
}

test.group('En-têtes de sécurité (functional)', (group) => {
  group.each.setup(() => truncateDb())

  for (const [label, path, asAdvisor] of [
    ['page publique', '/', false],
    ['page du dashboard', '/dashboard/conseiller', true],
  ] as const) {
    test(`${label} : CSP à nonce, HSTS, Permissions-Policy`, async ({ assert, client }) => {
      const request = client.get(path)
      if (asAdvisor) request.loginAs(await createAdvisor())
      const response = await request

      response.assertStatus(200)
      const csp = response.header('content-security-policy')
      assert.isString(csp, 'Content-Security-Policy absente')
      const policy = directives(csp)

      assert.deepEqual(policy.get('default-src'), [`'self'`])
      assert.deepEqual(policy.get('frame-ancestors'), [`'none'`])
      assert.deepEqual(policy.get('object-src'), [`'none'`])
      assert.deepEqual(policy.get('base-uri'), [`'self'`])
      assert.notInclude(policy.get('script-src') ?? [], `'unsafe-inline'`)
      assert.notInclude(policy.get('script-src') ?? [], `'unsafe-eval'`)

      // Chaque <script> du HTML porte le nonce de l'en-tête.
      const nonce = (policy.get('script-src') ?? [])
        .find((value) => value.startsWith(`'nonce-`))
        ?.slice(`'nonce-`.length, -1)
      assert.isString(nonce, 'nonce absent de script-src')
      const scripts = [...response.text().matchAll(/<script\b[^>]*>/g)].map(([tag]) => tag)
      assert.isNotEmpty(scripts)
      for (const tag of scripts) {
        assert.include(tag, `nonce="${nonce}"`, tag)
      }

      assert.include(response.header('strict-transport-security'), 'includeSubDomains')
      assert.include(response.header('strict-transport-security'), 'max-age=31536000')
      assert.equal(response.header('permissions-policy'), PERMISSIONS_POLICY)
      assert.include(response.header('permissions-policy'), 'camera=()')
    })
  }

  test('le nonce change à chaque requête', async ({ assert, client }) => {
    const first = await client.get('/')
    const second = await client.get('/')

    const nonceOf = (csp: string) => csp.match(/'nonce-([^']+)'/)?.[1]
    assert.notEqual(
      nonceOf(first.header('content-security-policy')),
      nonceOf(second.header('content-security-policy'))
    )
  })
})
