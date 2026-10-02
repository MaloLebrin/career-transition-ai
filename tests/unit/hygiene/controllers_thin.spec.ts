import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir, readFile } from 'node:fs/promises'

/**
 * Garde « contrôleurs fins » (CLAUDE.md, `.claude/rules/thin-controllers-domain-errors.mdc`).
 *
 * Les requêtes Lucid vont dans `app/services/`. Un cliquet plutôt qu'une
 * interdiction : chaque contrôleur existant garde au plus son nombre actuel de
 * `.query(`, un nouveau contrôleur n'en a aucun. Quand un refactor fait
 * baisser un compte, baisser la ligne de base ici (ou retirer l'entrée) — ne
 * jamais la relever.
 */
const BASELINE: Record<string, number> = {
  'dashboard_controller.ts': 2,
  'employee_syntheses_controller.ts': 4,
  'employees_controller.ts': 16,
  'exercise_results_controller.ts': 6,
  'pdf_exports_controller.ts': 1,
  'super_admin_controller.ts': 8,
  'support_plan_steps_controller.ts': 11,
}

async function queryCounts(): Promise<Record<string, number>> {
  const dir = app.makePath('app/controllers')
  const entries = await readdir(dir, { recursive: true })
  const counts: Record<string, number> = {}
  for (const entry of entries.filter((name) => name.endsWith('.ts'))) {
    const source = await readFile(`${dir}/${entry}`, 'utf8')
    counts[entry] = source.match(/\.query\(/g)?.length ?? 0
  }
  return counts
}

test.group('Hygiène — contrôleurs fins', () => {
  test('aucun contrôleur ne dépasse sa ligne de base de `.query(`', async ({ assert }) => {
    const counts = await queryCounts()
    const offenders = Object.entries(counts)
      .filter(([file, count]) => count > (BASELINE[file] ?? 0))
      .map(([file, count]) => `${file} : ${count} > ${BASELINE[file] ?? 0}`)

    assert.deepEqual(
      offenders,
      [],
      'Requêtes Lucid ajoutées dans un contrôleur : les déplacer dans un service (app/services/)'
    )
  })

  test('la ligne de base ne garde pas de marge inutilisée', async ({ assert }) => {
    const counts = await queryCounts()
    const stale = Object.entries(BASELINE)
      .filter(([file, allowed]) => (counts[file] ?? 0) < allowed)
      .map(([file, allowed]) => `${file} : ${counts[file] ?? 0} < ${allowed}`)

    assert.deepEqual(stale, [], 'Baisser la ligne de base de ces contrôleurs dans ce spec')
  })
})
