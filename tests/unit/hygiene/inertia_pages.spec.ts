import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { glob, readFile } from 'node:fs/promises'
import { dirname, posix, relative } from 'node:path'

/**
 * Une page Inertia n'importe jamais une autre page.
 *
 * Chaque fichier de `inertia/pages/` est une entrée dynamique (`import.meta.glob`)
 * que le layout Edge demande à Vite par son chemin source (`@vite([…pages/X.tsx])`).
 * Une page qui en importe ou ré-exporte une autre (`export { default } from
 * './employee/profile/Home'`) est fusionnée avec elle en un seul chunk sans
 * chemin source : aucune des deux n'a d'entrée dans le manifest et la route
 * répond 500 en production — sans qu'aucun test dev ne le voie. Le code partagé
 * va dans `inertia/components/`. Le smoke test du build
 * (`scripts/smoke_prod_build.mjs`) vérifie aussi le manifest.
 */
const PAGES_DIR = 'inertia/pages'
const IMPORT_SPECIFIERS =
  /\b(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g

function resolvesIntoPages(file: string, specifier: string): boolean {
  if (specifier.startsWith('~/pages/')) return true
  if (!specifier.startsWith('.')) return false
  const target = posix.normalize(posix.join(dirname(file), specifier))
  return target === PAGES_DIR || target.startsWith(`${PAGES_DIR}/`)
}

test.group('Hygiène | pages Inertia', () => {
  test('aucune page n’importe ni ne ré-exporte une autre page', async ({ assert }) => {
    const offenders: string[] = []
    for await (const absolute of glob(`${PAGES_DIR}/**/*.{ts,tsx}`, { cwd: app.makePath() })) {
      const file = relative(app.makePath(), app.makePath(absolute)).split('\\').join('/')
      const source = await readFile(app.makePath(file), 'utf-8')
      for (const match of source.matchAll(IMPORT_SPECIFIERS)) {
        const specifier = match[1] ?? match[2]
        if (resolvesIntoPages(file, specifier)) offenders.push(`${file} → ${specifier}`)
      }
    }

    assert.deepEqual(offenders, [], 'déplacer le code partagé dans inertia/components/')
  })

  test('le motif détecte import, ré-export et import dynamique', ({ assert }) => {
    const file = 'inertia/pages/dashboard/EmployeeProfile.tsx'
    const sources = [
      "export { default } from './employee/profile/Home'",
      "import Home from './employee/profile/Home'",
      "const Home = await import('../dashboard/Home')",
      "import Home from '~/pages/dashboard/Home'",
    ]
    for (const source of sources) {
      const specifiers = [...source.matchAll(IMPORT_SPECIFIERS)].map((m) => m[1] ?? m[2])
      assert.isTrue(
        specifiers.some((s) => resolvesIntoPages(file, s)),
        source
      )
    }
    assert.isFalse(resolvesIntoPages(file, '../../components/ui/Button'))
    assert.isFalse(resolvesIntoPages(file, '../../../config/exercises'))
    assert.isFalse(resolvesIntoPages(file, '@inertiajs/react'))
  })
})
