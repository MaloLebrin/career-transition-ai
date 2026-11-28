import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

/**
 * Garde du périmètre d'équipe (#167).
 *
 * Une fiche candidat désignée par son id (paramètre de route, le plus souvent)
 * se lit avec `teamEmployeeScope(user)` : filtrer par `organizationId` seul
 * laisse un conseiller ou un expert de l'organisation plateforme atteindre,
 * par énumération d'ids, les particuliers assignés à un autre expert.
 *
 * Règle lue dans le source de `app/services` et `app/controllers` :
 * - toute expression `Employee.query(…)` (transaction comprise) qui filtre sur
 *   l'id (`where('id' | 'employees.id', …)`, `whereIn(…)`, `where({ id })`)
 *   doit appliquer `teamEmployeeScope` ;
 * - `Employee.find*(…)`, qui ne peut pas être scopé, compte toujours.
 *
 * Une exception se justifie dans `ALLOWED` (chemin → nombre d'occurrences
 * tolérées + raison) ; on ne relève jamais un compteur, on le baisse.
 */
const ALLOWED: Record<string, { count: number; reason: string }> = {
  'app/services/candidate_data_service.ts': {
    count: 3,
    reason: 'commandes ace candidate:export / candidate:purge : aucun utilisateur connecté',
  },
  'app/services/exercise_results_service.ts': {
    count: 3,
    reason:
      'fiche déjà résolue par l’appelant (rechargement, saveResult / saveDraft : id venu de employeeIdInOrganization ou de la fiche du candidat)',
  },
  'app/services/super_admin_payments_service.ts': {
    count: 1,
    reason: 'back-office super admin, borné à l’organisation plateforme',
  },
  'app/services/expert_requests_service.ts': {
    count: 2,
    reason: 'back-office super admin : fiche tirée de la demande d’accompagnement',
  },
  'app/services/entitlements_service.ts': {
    count: 2,
    reason: 'fiche déjà résolue (verrou de grantManual) ou tirée du paiement',
  },
  'app/services/billing/payments_service.ts': {
    count: 2,
    reason: 'webhook Stripe : fiche tirée du paiement, aucun utilisateur connecté',
  },
}

const ROOTS = ['app/services', 'app/controllers']

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return Promise.resolve(entry.name.endsWith('.ts') ? [path] : [])
    })
  )
  return nested.flat()
}

/**
 * Expression complète qui suit `Employee.query(…)` : chaîne de méthodes jusqu'à
 * la fin d'instruction (`;`, `,`, ligne suivante qui ne continue pas la chaîne,
 * ou parenthèse englobante refermée).
 */
function chainAt(source: string, start: number): string {
  let depth = 0
  for (let index = start; index < source.length; index++) {
    const char = source[index]
    if (char === '(' || char === '{' || char === '[') depth++
    else if (char === ')' || char === '}' || char === ']') {
      if (depth === 0) return source.slice(start, index)
      depth--
    } else if (depth === 0 && (char === ';' || char === ',')) {
      return source.slice(start, index)
    } else if (depth === 0 && char === '\n' && !/^\s*\./.test(source.slice(index + 1))) {
      return source.slice(start, index)
    }
  }
  return source.slice(start)
}

/** `Employee.query()` ou `Employee.query({ client: trx })`. */
const QUERY = /Employee\.query\((?:\{[^}]*\})?\s*\)/g
/** `Employee.find(…)`, `findOrFail`, `findBy`, `findByOrFail`, `findMany`… */
const FINDER = /Employee\.find\w*\(/g
const ID_FILTER =
  /\.(?:where|whereIn|andWhere|orWhere)\(\s*['"](?:employees\.)?id['"]|\.where\(\s*\{\s*id\b/

function isUnscopedIdLookup(chain: string): boolean {
  return ID_FILTER.test(chain) && !chain.includes('teamEmployeeScope')
}

function unscopedIn(source: string): number {
  const queries = [...source.matchAll(QUERY)]
    .map((match) => chainAt(source, match.index + match[0].length))
    .filter(isUnscopedIdLookup)
  const finders = [...source.matchAll(FINDER)]
  return queries.length + finders.length
}

async function unscopedLookups(): Promise<Record<string, number>> {
  const perRoot = await Promise.all(ROOTS.map((root) => sourceFiles(app.makePath(root))))
  const counts = await Promise.all(
    perRoot.flat().map(async (file) => {
      const source = await readFile(file, 'utf8')
      return [relative(app.makePath(), file), unscopedIn(source)] as const
    })
  )
  return Object.fromEntries(counts.filter(([, count]) => count > 0))
}

test.group('Hygiène — périmètre d’équipe des fiches candidat', () => {
  test('chainAt découpe la chaîne de méthodes', ({ assert }) => {
    const source = `const e = await Employee.query()\n  .where('id', 1)\n  .where(teamEmployeeScope(user))\n  .first()\nreturn e`
    const start = source.indexOf('Employee.query()') + 'Employee.query()'.length
    const chain = chainAt(source, start)
    assert.include(chain, 'teamEmployeeScope')
    assert.notInclude(chain, 'return e')

    const inline = `whereIn('employeeId', Employee.query().select('id').where('id', 2)), other`
    const inlineStart = inline.indexOf('Employee.query()') + 'Employee.query()'.length
    assert.equal(chainAt(inline, inlineStart), `.select('id').where('id', 2)`)
  })

  test('repère les variantes de lecture par id', ({ assert }) => {
    const unscoped = [
      `Employee.query().where('id', params.id).first()`,
      `Employee.query({ client: trx }).where('id', id).forUpdate().first()`,
      `Employee.query().where('employees.id', id).first()`,
      `Employee.query().whereIn('id', ids)`,
      `Employee.query().where({ id }).first()`,
      `Employee.findOrFail(params.id)`,
      `Employee.find(id)`,
      `Employee.findBy('id', id)`,
    ]
    unscoped.forEach((source) => assert.equal(unscopedIn(source), 1, source))

    const scoped = [
      `Employee.query().where('id', id).where(teamEmployeeScope(user)).first()`,
      `Employee.query({ client: trx }).where('id', id).where(teamEmployeeScope(user)).first()`,
      `Employee.query().where('userId', user.id).first()`,
      `Employee.query().select('id').where(teamEmployeeScope(user))`,
    ]
    scoped.forEach((source) => assert.equal(unscopedIn(source), 0, source))
  })

  test('une fiche lue par id passe par teamEmployeeScope', async ({ assert }) => {
    const found = await unscopedLookups()
    const excess = Object.entries(found)
      .filter(([file, count]) => count > (ALLOWED[file]?.count ?? 0))
      .map(([file, count]) => `${file} (${count})`)

    assert.deepEqual(
      excess,
      [],
      'Appliquer `.where(teamEmployeeScope(user))` à ces lectures de fiche (#167)'
    )
  })

  test('la liste blanche ne garde que des exceptions encore présentes', async ({ assert }) => {
    const found = await unscopedLookups()
    const stale = Object.entries(ALLOWED)
      .filter(([file, { count }]) => (found[file] ?? 0) < count)
      .map(([file]) => file)

    assert.deepEqual(stale, [], 'Baisser ou retirer ces entrées de ALLOWED')
  })
})
