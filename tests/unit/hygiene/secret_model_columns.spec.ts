import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir, readFile } from 'node:fs/promises'

/**
 * Garde des colonnes sensibles (repris de boat-management).
 *
 * Une colonne dont le nom évoque un secret (`password`, `token`, `secret`,
 * `hash`, `key`) doit porter `serializeAs: null` : un `serialize()` ou un
 * modèle passé tel quel à une page Inertia ne doit jamais l'exposer. Lecture
 * du source plutôt qu'import des modèles, pour couvrir aussi un modèle neuf.
 *
 * Une exception se justifie dans `ALLOWED`, avec la raison.
 */
const SECRET_NAME = /password|token|secret|hash|key/i

const ALLOWED: Record<string, string> = {}

interface Column {
  model: string
  name: string
  decorator: string
}

async function columns(): Promise<Column[]> {
  const dir = app.makePath('app/models')
  const found: Column[] = []
  const files = await readdir(dir)
  for (const file of files.filter((name) => name.endsWith('.ts'))) {
    const source = await readFile(`${dir}/${file}`, 'utf8')
    const pattern = /(@column(?:\.\w+)?\([^)]*\))\s*(?:\/\*\*[\s\S]*?\*\/\s*)?declare (\w+)/g
    for (const match of source.matchAll(pattern)) {
      found.push({ model: file, decorator: match[1], name: match[2] })
    }
  }
  return found
}

test.group('Hygiène — colonnes sensibles des modèles', () => {
  test('les colonnes secrètes ne sont jamais sérialisées', async ({ assert }) => {
    const all = await columns()
    assert.isNotEmpty(all)

    const exposed = all
      .filter(({ name }) => SECRET_NAME.test(name))
      .filter(({ model, name }) => !ALLOWED[`${model}:${name}`])
      .filter(({ decorator }) => !/serializeAs:\s*null/.test(decorator))
      .map(({ model, name }) => `${model}:${name}`)

    assert.deepEqual(exposed, [], 'Ajouter `serializeAs: null` à ces colonnes')
  })
})
