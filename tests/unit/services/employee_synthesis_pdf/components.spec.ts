import {
  ROLE_SEPARATOR,
  formatDate,
  synthesisRoleText,
} from '#services/employee_synthesis_pdf/components'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir, readFile } from 'node:fs/promises'

const PDF_DIR = app.makePath('app/services/employee_synthesis_pdf')

/**
 * Caractères absents de l'encodage WinAnsi des polices standard du PDF
 * (Helvetica) : rendus par un autre glyphe (« → » sortait en « ' »).
 */
const UNSUPPORTED_GLYPHS = ['→', '←', '⟶', '✓', '✔', '★']

test.group('PDF de synthèse — synthesisRoleText', () => {
  test('relie poste actuel et poste visé par un séparateur que Helvetica sait afficher', ({
    assert,
  }) => {
    assert.equal(
      synthesisRoleText({ currentRole: 'Lead développeur', targetRole: 'Formateur tech' }),
      'Lead développeur › Formateur tech'
    )
    assert.notInclude(ROLE_SEPARATOR, '→')
  })

  test('sans poste visé : poste actuel seul, sans séparateur', ({ assert }) => {
    assert.equal(synthesisRoleText({ currentRole: 'Développeur' }), 'Développeur')
    assert.equal(synthesisRoleText({ currentRole: 'Développeur', targetRole: '  ' }), 'Développeur')
    assert.equal(synthesisRoleText({ currentRole: 'Développeur', targetRole: null }), 'Développeur')
  })

  test('aucun texte du PDF n’utilise de glyphe hors WinAnsi', async ({ assert }) => {
    const offenders: string[] = []
    for (const entry of await readdir(PDF_DIR, { recursive: true })) {
      if (!entry.endsWith('.tsx') && !entry.endsWith('.ts')) continue
      const source = await readFile(`${PDF_DIR}/${entry}`, 'utf8')
      const code = source
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .join('\n')
      UNSUPPORTED_GLYPHS.filter((glyph) => code.includes(glyph)).forEach((glyph) =>
        offenders.push(`${entry} : ${glyph}`)
      )
    }
    assert.deepEqual(offenders, [])
  })
})

test.group('PDF de synthèse — formatDate', () => {
  test('format court jj/mm/aaaa', ({ assert }) => {
    assert.equal(formatDate('2026-01-15T10:00:00.000Z'), '15/01/2026')
  })

  test('garde le jour d’une date sérialisée à minuit heure de Paris, quel que soit le fuseau du serveur', ({
    assert,
  }) => {
    const previousTz = process.env.TZ
    process.env.TZ = 'UTC'
    try {
      assert.equal(formatDate('2024-06-02T00:00:00.000+02:00'), '02/06/2024')
    } finally {
      process.env.TZ = previousTz
    }
  })

  test('vide ou invalide : chaîne vide ou valeur brute', ({ assert }) => {
    assert.equal(formatDate(null), '')
    assert.equal(formatDate(undefined), '')
    assert.equal(formatDate('bientôt'), 'bientôt')
  })
})
