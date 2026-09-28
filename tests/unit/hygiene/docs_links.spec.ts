import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { access, glob, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Garde de la documentation (issue #20).
 *
 * `docs/README.md` pointait vers six pages jamais écrites, et un guide Clever
 * Cloud décrivait un workflow et un script inexistants. Cette garde échoue si
 * un lien relatif de la documentation mène à un fichier absent, ou si le
 * déploiement Clever Cloud réapparaît dans les docs. Le changelog, historique,
 * n'est pas contrôlé.
 */
const DOC_GLOBS = ['README.md', 'docs/*.md', 'docs/process/*.md']

/** Analyse d'hébergement : elle retrace l'existant, retrait de Clever Cloud compris. */
const HISTORY_DOCS = ['docs/hosting.md']

/** Cible d'un lien Markdown `[texte](cible)`. */
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g

async function docFiles() {
  const files: string[] = []
  for (const pattern of DOC_GLOBS) {
    for await (const file of glob(pattern, { cwd: app.makePath() })) files.push(file)
  }
  return files.sort()
}

/** Chemin local visé par un lien, `null` pour une URL ou une ancre seule. */
function localTarget(link: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) return null
  return decodeURIComponent(link.split('#')[0])
}

async function exists(path: string) {
  try {
    await access(app.makePath(path))
    return true
  } catch {
    return false
  }
}

test.group('Hygiène — documentation', () => {
  test('aucun lien relatif mort', async ({ assert }) => {
    const dead: string[] = []
    for (const file of await docFiles()) {
      const contents = await readFile(app.makePath(file), 'utf-8')
      for (const [, link] of contents.matchAll(LINK)) {
        const target = localTarget(link)
        if (target && !(await exists(join(dirname(file), target)))) {
          dead.push(`${file} → ${link}`)
        }
      }
    }

    assert.deepEqual(dead, [])
  })

  test('plus de déploiement Clever Cloud', async ({ assert }) => {
    const offenders: string[] = []
    for (const file of await docFiles()) {
      if (HISTORY_DOCS.includes(file)) continue
      const contents = await readFile(app.makePath(file), 'utf-8')
      if (/clever[\s-]?cloud|clevercloud|\bCC_[A-Z]/i.test(contents)) offenders.push(file)
    }

    assert.deepEqual(offenders, [])
    assert.isFalse(await exists('clevercloud'), 'dossier clevercloud/ supprimé')
  })
})
