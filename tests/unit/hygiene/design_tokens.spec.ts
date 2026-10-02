import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { glob, readFile } from 'node:fs/promises'

/**
 * Garde du design system (DESIGN.md §2, CLAUDE.md « Design system »).
 *
 * 1. Les classes de couleur legacy (`brand-*`, `slate-*`, `rose-*`, `violet-*`, `white/N`)
 *    sont un cliquet par dossier : les surfaces migrées sont à zéro, les autres gardent
 *    au plus leur compte actuel. Quand une migration fait baisser un compte, baisser la
 *    ligne de base ici — ne jamais la relever.
 * 2. `inertia/css/app.css` ne redéfinit pas les tokens retirés et aucun `--color-x` ne
 *    porte le nom d'un `--text-x` (les deux génèrent la classe `text-x`).
 * 3. Sur une surface ink, le teal passe par `accent-on-ink`, jamais `text-accent`.
 */
const LEGACY_CLASS =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|shadow|placeholder|divide|outline|hover:bg|hover:text|hover:border|focus:ring|focus:border|group-hover:text|data-focus:bg|data-selected:bg|focus-within:border|focus-within:ring|disabled:bg)-(?:brand-[a-z]+|slate-\d+|rose-\d+|violet-\d+|white\/\d+)\b/g

const BASELINE: Record<string, number> = {
  'inertia/components/auth': 0,
  'inertia/components/dashboard': 247,
  'inertia/components/design-system': 0,
  'inertia/components/errors': 0,
  'inertia/components/exercises': 297,
  'inertia/components/landing': 0,
  'inertia/components/layout': 0,
  'inertia/components/marketing': 0,
  'inertia/components/modals': 86,
  'inertia/components/notifications': 16,
  'inertia/components/onboarding': 23,
  'inertia/components/profile': 60,
  'inertia/components/settings': 11,
  'inertia/components/ui': 0,
  'inertia/pages': 448,
}

const REMOVED_TOKENS = [
  '--color-accent-warm',
  '--color-primary-on-ink',
  '--color-tint-sage',
  '--color-tint-teal',
  '--color-tint-sand',
  '--color-tint-terracotta',
  '--color-brand-violet',
]

const INK_SURFACES = [
  'inertia/components/marketing/CtaBand.tsx',
  'inertia/components/marketing/PricingTierCard.tsx',
  'inertia/components/layout/PublicFooter.tsx',
]

async function legacyCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const dir of Object.keys(BASELINE)) {
    let count = 0
    for await (const file of glob('**/*.tsx', { cwd: app.makePath(dir) })) {
      const source = await readFile(app.makePath(dir, file), 'utf8')
      count += source.match(LEGACY_CLASS)?.length ?? 0
    }
    counts[dir] = count
  }
  return counts
}

test.group('Hygiène | design tokens', () => {
  test('aucun dossier ne dépasse sa ligne de base de classes de couleur legacy', async ({
    assert,
  }) => {
    const counts = await legacyCounts()
    const offenders = Object.entries(counts)
      .filter(([dir, count]) => count > BASELINE[dir])
      .map(([dir, count]) => `${dir} : ${count} > ${BASELINE[dir]}`)

    assert.deepEqual(
      offenders,
      [],
      'Classes `brand-*`/`slate-*`/`rose-*`/`violet-*`/`white/N` ajoutées : utiliser les rôles de DESIGN.md'
    )
  })

  test('la ligne de base ne garde pas de marge inutilisée', async ({ assert }) => {
    const counts = await legacyCounts()
    const stale = Object.entries(BASELINE)
      .filter(([dir, allowed]) => counts[dir] < allowed)
      .map(([dir, allowed]) => `${dir} : ${counts[dir]} < ${allowed}`)

    assert.deepEqual(stale, [], 'Baisser la ligne de base de ces dossiers dans ce spec')
  })

  test('app.css ne définit plus les tokens retirés', async ({ assert }) => {
    const css = await readFile(app.makePath('inertia/css/app.css'), 'utf8')
    const present = REMOVED_TOKENS.filter(
      (token) => css.includes(`${token}:`) || css.includes(`${token}-`)
    )
    assert.deepEqual(present, [], 'Tokens retirés par la refonte couleurs réintroduits dans @theme')
  })

  test('aucun --color-x ne porte le nom d’un --text-x dans @theme', async ({ assert }) => {
    const css = await readFile(app.makePath('inertia/css/app.css'), 'utf8')
    const colors = new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]))
    const texts = new Set(
      [...css.matchAll(/--text-([a-z0-9]+(?:-[a-z0-9]+)*?)(?:--[a-z-]+)?:/g)].map((m) => m[1])
    )
    const collisions = [...colors].filter((name) => texts.has(name))
    assert.deepEqual(collisions, [], '`--color-x` et `--text-x` génèrent tous deux `text-x`')
  })

  test('les surfaces ink utilisent accent-on-ink, jamais text-accent', async ({ assert }) => {
    const offenders: string[] = []
    for (const file of INK_SURFACES) {
      const source = await readFile(app.makePath(file), 'utf8')
      if (/\btext-accent(?!-on-ink)\b/.test(source.replace(/'text-accent'(?=\s*\})/g, ''))) {
        offenders.push(file)
      }
    }
    assert.deepEqual(offenders, [], 'Sur `bg-ink`, le teal passe par `text-accent-on-ink`')
  })
})
