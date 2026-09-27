import inertiaConfig from '#config/inertia'
import viteConfig from '#config/vite'
import { test } from '@japa/runner'
import { isAbsolute } from 'node:path'

/**
 * Garde des chemins du bundle SSR et du manifest Vite.
 *
 * Ces chemins sont résolus relativement à la racine de l'app. En production,
 * la racine **est** le dossier de build (`node ace build` → `build/`) : un
 * chemin préfixé par `build/` y donne `build/build/…`, le bundle SSR est
 * introuvable (`ERR_MODULE_NOT_FOUND`) et toutes les pages répondent 500.
 *
 * Non-régression de l'issue #8.
 */

/** Dossier de sortie de `node ace build` (défaut AdonisJS, non surchargé dans adonisrc.ts). */
const BUILD_OUT_DIR = 'build'

function assertRootRelative(assert: any, label: string, value: string) {
  assert.isFalse(isAbsolute(value), `${label} doit être relatif à la racine de l'app`)
  assert.notMatch(
    value,
    new RegExp(`^\\.?/?${BUILD_OUT_DIR}/`),
    `${label} ne doit pas être préfixé par "${BUILD_OUT_DIR}/" : en production la racine de l'app est déjà "${BUILD_OUT_DIR}/"`
  )
}

test.group('Hygiène — chemins du build de production', () => {
  test('le bundle SSR Inertia est relatif à la racine de l’app, sans préfixe build/', ({
    assert,
  }) => {
    assertRootRelative(assert, 'inertia.ssr.bundle', inertiaConfig.ssr.bundle)
    assert.equal(inertiaConfig.ssr.bundle, 'ssr/ssr.js')
  })

  test('le manifest Vite est relatif à la racine de l’app, sans préfixe build/', ({ assert }) => {
    assertRootRelative(assert, 'vite.manifestFile', viteConfig.manifestFile)
    assert.equal(viteConfig.manifestFile, 'public/assets/.vite/manifest.json')
  })
})
