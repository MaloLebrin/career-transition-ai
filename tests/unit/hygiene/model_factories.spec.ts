import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir } from 'node:fs/promises'

/**
 * Garde « un modèle, une factory » (CLAUDE.md, `.claude/rules/enums-factories-seeders.mdc`).
 *
 * Chaque `app/models/<x>.ts` a sa `database/factories/<x>_factory.ts` : un
 * test qui a besoin d'une ligne l'obtient sans `Model.create({...})` écrit à
 * la main (et sans chaîne magique pour les enums). Lecture du disque plutôt
 * qu'import, pour couvrir aussi un modèle neuf.
 *
 * Une exception se justifie dans `ALLOWED`, avec la raison.
 */
const ALLOWED: Record<string, string> = {}

async function tsBasenames(dir: string): Promise<string[]> {
  const files = await readdir(app.makePath(dir))
  return files.filter((name) => name.endsWith('.ts')).map((name) => name.replace(/\.ts$/, ''))
}

test.group('Hygiène — factories des modèles', () => {
  test('chaque modèle a sa factory', async ({ assert }) => {
    const models = await tsBasenames('app/models')
    const factories = new Set(await tsBasenames('database/factories'))
    assert.isNotEmpty(models)

    const missing = models
      .filter((model) => !ALLOWED[model])
      .filter((model) => !factories.has(`${model}_factory`))
      .map((model) => `database/factories/${model}_factory.ts`)

    assert.deepEqual(missing, [], 'Créer ces factories (style de note_factory.ts)')
  })

  test("l'allowlist ne garde pas d'exception inutile", async ({ assert }) => {
    const models = new Set(await tsBasenames('app/models'))
    const factories = new Set(await tsBasenames('database/factories'))

    const stale = Object.keys(ALLOWED).filter(
      (model) => !models.has(model) || factories.has(`${model}_factory`)
    )

    assert.deepEqual(stale, [], 'Retirer ces entrées de ALLOWED')
  })
})
