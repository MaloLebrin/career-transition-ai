import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir } from 'node:fs/promises'

/**
 * Garde « un fichier de code, un fichier de test » (CLAUDE.md, « Tests obligatoires »).
 *
 * Chaque `.ts` des répertoires de `SOURCE_DIRS` a un test `<nom>.spec.ts`
 * (ou `.spec.tsx`, `.test.ts`, `.test.tsx`) quelque part sous `tests/`
 * (unit, functional, inertia…).
 *
 * Homonymes : plusieurs sources partagent un même nom (`index.ts`,
 * `prompts/x.ts` vs `use_cases/x.ts`, `helpers/media.ts` vs
 * `constants/media.ts`…). Un test `x.spec.ts` ne peut alors pas couvrir les
 * deux : pour chaque source, on calcule le plus court suffixe de chemin qui la
 * distingue des autres (`x` si le nom est unique, `use_cases/x` sinon) et le
 * chemin du test (sans extension) doit se terminer par ce suffixe. Un nom
 * unique reste donc libre d'emplacement ; un homonyme impose de reproduire le
 * dernier répertoire distinctif (`tests/unit/shared/helpers/ai/use_cases/x.spec.ts`).
 *
 * Une exception (fichier sans code exécutable) se justifie dans `ALLOWED`.
 */
const SOURCE_DIRS = [
  'app/services',
  'app/controllers',
  'app/utils',
  'app/mappers',
  'shared/helpers',
  'shared/constants',
]

const TEST_SUFFIX = /\.(spec|test)\.tsx?$/

const ALLOWED: Record<string, string> = {
  'app/services/ai/ai_text_completion_provider.ts': 'interface seule, aucun code exécutable',
  'app/services/mail/types.ts': 'types et interface seuls, aucun code exécutable',
  'shared/helpers/ai/ai_client.ts': 'types et interface `AiClient` seuls, aucun code exécutable',
  'app/services/employee_synthesis_pdf/index.ts':
    'barrel de ré-export de `./document.js`, testé via document.ts',
}

async function listFiles(dir: string, keep: (name: string) => boolean): Promise<string[]> {
  const entries = await readdir(app.makePath(dir), { recursive: true })
  return entries
    .map((entry) => entry.split('\\').join('/'))
    .filter(keep)
    .map((entry) => `${dir}/${entry}`)
}

async function sourceFiles(): Promise<string[]> {
  const lists = await Promise.all(
    SOURCE_DIRS.map((dir) =>
      listFiles(dir, (name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
    )
  )
  return lists.flat().sort()
}

/** Chemins des tests sous `tests/`, découpés en segments et privés de leur suffixe. */
async function testPaths(): Promise<string[][]> {
  const files = await listFiles('tests', (name) => TEST_SUFFIX.test(name))
  return files.map((file) => file.replace(TEST_SUFFIX, '').split('/'))
}

/** Plus court suffixe de segments (sans `.ts`) qui distingue `source` des autres sources. */
function distinctiveSuffix(source: string, all: string[]): string[] {
  const segments = source.replace(/\.ts$/, '').split('/')
  const others = all.filter((other) => other !== source).map((o) => o.replace(/\.ts$/, ''))
  for (let length = 1; length <= segments.length; length++) {
    const suffix = segments.slice(-length)
    const clash = others.some((other) => endsWith(other.split('/'), suffix))
    if (!clash) return suffix
  }
  return segments
}

function endsWith(path: string[], suffix: string[]): boolean {
  if (suffix.length > path.length) return false
  return suffix.every((segment, index) => path[path.length - suffix.length + index] === segment)
}

test.group('Hygiène — tests miroirs', () => {
  test('chaque fichier de code a son fichier de test', async ({ assert }) => {
    const sources = await sourceFiles()
    const tests = await testPaths()
    assert.isNotEmpty(sources)

    const missing = sources
      .filter((source) => !ALLOWED[source])
      .filter((source) => {
        const suffix = distinctiveSuffix(source, sources)
        return !tests.some((path) => endsWith(path, suffix))
      })
      .map((source) => `${source} → ${distinctiveSuffix(source, sources).join('/')}.spec.ts`)

    assert.deepEqual(missing, [], 'Ajouter un test pour ces fichiers (ou justifier dans ALLOWED)')
  })

  test("l'allowlist ne garde pas d'exception inutile", async ({ assert }) => {
    const sources = new Set(await sourceFiles())
    const stale = Object.keys(ALLOWED).filter((source) => !sources.has(source))

    assert.deepEqual(stale, [], 'Retirer ces entrées de ALLOWED (fichier supprimé ou déplacé)')
  })
})
