import { test } from '@japa/runner'
import { readFileSync } from 'node:fs'

/**
 * Helpers du test de fumée du build de production
 * (`scripts/smoke_prod_build.mjs`, job `smoke-prod-build` de la CI).
 *
 * Le script lui-même démarre `build/` et n'est exécuté qu'en CI ; ces tests
 * figent ce qu'il considère comme un échec, pour qu'un assouplissement
 * involontaire (regex trop large, niveau de log relevé) ne rende pas le job
 * vert sur un build cassé.
 */

// Spécifieur non littéral : le module est un .mjs sans déclarations de types.
const scriptUrl = new URL('../../../scripts/smoke_prod_build.mjs', import.meta.url).href
const { findLogProblems, checkInertiaShell, extractAssetPaths, missingPageEntries, SMOKE_PAGES } =
  (await import(scriptUrl)) as {
    findLogProblems: (output: string) => string[]
    checkInertiaShell: (html: string) => string[]
    extractAssetPaths: (html: string) => string[]
    missingPageEntries: (manifest: Record<string, unknown>, pages: string[]) => string[]
    SMOKE_PAGES: string[]
  }

const line = (entry: Record<string, unknown>) => JSON.stringify({ time: 1, pid: 1, ...entry })

test.group('smoke_prod_build | findLogProblems', () => {
  test('ignore les logs info et warn ordinaires', ({ assert }) => {
    const output = [
      line({ level: 30, msg: 'started HTTP server on 127.0.0.1:3333' }),
      line({ level: 40, msg: 'slow query' }),
      '[ info ] Starting worker for queues: default, ai, pdfs, analytics',
      '',
    ].join('\n')

    assert.deepEqual(findLogProblems(output), [])
  })

  test('remonte les erreurs pino (level >= 50)', ({ assert }) => {
    const error = line({ level: 50, err: { message: "Cannot find module 'build/ssr/ssr.js'" } })
    const fatal = line({ level: 60, msg: 'boom' })

    assert.deepEqual(findLogProblems([error, fatal].join('\n')), [error, fatal])
  })

  test("remonte l'avertissement de jobs introuvables, en JSON comme en texte", ({ assert }) => {
    const json = line({ level: 40, msg: 'No jobs found for locations: /app/app/jobs/**/*.js.' })
    const plain = 'WARN No jobs found for locations: app/jobs/**/*.js'

    assert.deepEqual(findLogProblems(`${json}\n${plain}`), [json, plain])
  })
})

test.group('smoke_prod_build | checkInertiaShell', () => {
  test('accepte une racine Inertia rendue par le SSR', ({ assert }) => {
    const html =
      '<body><div id="app" data-page="{&quot;component&quot;:&quot;home&quot;}"><main>Accueil</main></div></body>'

    assert.deepEqual(checkInertiaShell(html), [])
  })

  test('refuse une racine vide (SSR non rendu)', ({ assert }) => {
    const html = '<body><div id="app" data-page="{}">\n  </div></body>'

    assert.lengthOf(checkInertiaShell(html), 1)
  })

  test('refuse une page sans racine Inertia', ({ assert }) => {
    assert.lengthOf(checkInertiaShell('<html><body>Internal Server Error</body></html>'), 1)
  })
})

test.group('smoke_prod_build | extractAssetPaths', () => {
  test('extrait les assets du manifest Vite, sans doublon ni URL externe', ({ assert }) => {
    const html = [
      '<link rel="stylesheet" href="/assets/app-abc.css">',
      '<script type="module" src="/assets/app-def.js"></script>',
      '<script type="module" src="/assets/app-def.js"></script>',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
    ].join('')

    assert.deepEqual(extractAssetPaths(html), ['/assets/app-abc.css', '/assets/app-def.js'])
  })
})

test.group('smoke_prod_build | câblage', () => {
  test('vérifie la page d’accueil et la page de connexion', ({ assert }) => {
    assert.includeMembers(SMOKE_PAGES, ['/', '/auth/login'])
  })

  test('la CI démarre le build en production avec le script de fumée', ({ assert }) => {
    const workflow = readFileSync(
      new URL('../../../.github/workflows/ci.yml', import.meta.url),
      'utf8'
    )

    assert.include(workflow, 'smoke-prod-build:')
    assert.include(workflow, 'node scripts/smoke_prod_build.mjs')
    assert.include(workflow, 'NODE_ENV: production')
  })
})

test.group('smoke_prod_build | missingPageEntries', () => {
  test('aucune page manquante quand chacune a son entrée', ({ assert }) => {
    const manifest = { 'inertia/pages/home.tsx': {}, 'inertia/pages/auth/Login.tsx': {} }

    assert.deepEqual(
      missingPageEntries(manifest, ['inertia/pages/home.tsx', 'inertia/pages/auth/Login.tsx']),
      []
    )
  })

  /** Cas réel : une page ré-exportée par une autre, fusionnées en un chunk `_Nom-hash.js`. */
  test('remonte les pages fusionnées dans un chunk sans chemin source', ({ assert }) => {
    const manifest = {
      '_EmployeeProfile-Bx01yorx.js': { file: 'assets/EmployeeProfile-Bx01yorx.js' },
      'inertia/pages/home.tsx': {},
    }

    assert.deepEqual(
      missingPageEntries(manifest, [
        'inertia/pages/home.tsx',
        'inertia/pages/dashboard/employee/profile/Home.tsx',
        'inertia/pages/dashboard/EmployeeProfile.tsx',
      ]),
      [
        'inertia/pages/dashboard/EmployeeProfile.tsx',
        'inertia/pages/dashboard/employee/profile/Home.tsx',
      ]
    )
  })
})
