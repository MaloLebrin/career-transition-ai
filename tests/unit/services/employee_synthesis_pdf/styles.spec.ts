import { C, PAGE_PAD, s } from '#services/employee_synthesis_pdf/styles'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readdir, readFile } from 'node:fs/promises'

/** Polices standard PDF embarquées par @react-pdf (aucun `Font.register` dans le module). */
const BUILTIN_FONTS = ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique']

const PDF_DIR = app.makePath('app/services/employee_synthesis_pdf')

/** Références `s.xxx` / `C.xxx` utilisées par les composants du PDF. */
async function referencedKeys(prefix: 's' | 'C'): Promise<Set<string>> {
  const keys = new Set<string>()
  const pattern = new RegExp(`\\b${prefix}\\.([a-zA-Z]+)`, 'g')
  for (const entry of await readdir(PDF_DIR)) {
    if (!entry.endsWith('.tsx')) continue
    const source = await readFile(`${PDF_DIR}/${entry}`, 'utf8')
    for (const match of source.matchAll(pattern)) keys.add(match[1])
  }
  return keys
}

test.group('employee_synthesis_pdf/styles — palette', () => {
  test('chaque couleur est un hex #rrggbb', ({ assert }) => {
    const entries = Object.entries(C)
    assert.isAbove(entries.length, 0)
    for (const [key, value] of entries) {
      assert.match(value, /^#[0-9a-f]{6}$/, `C.${key}`)
    }
  })

  test('les couleurs de base de la charte sont présentes et distinctes', ({ assert }) => {
    assert.includeMembers(Object.keys(C), ['primary', 'dark', 'gray', 'white', 'green', 'red'])
    assert.equal(C.white, '#ffffff')
    assert.notEqual(C.primary, C.primaryDark)
  })

  test('les composants du PDF ne référencent que des couleurs existantes', async ({ assert }) => {
    const used = await referencedKeys('C')
    assert.isAbove(used.size, 0)
    assert.includeMembers(Object.keys(C), [...used])
  })
})

test.group('employee_synthesis_pdf/styles — feuille de style', () => {
  test('aucun style vide ni valeur vide/indéfinie', ({ assert }) => {
    const entries = Object.entries(s)
    assert.isAbove(entries.length, 0)
    for (const [name, style] of entries) {
      const props = Object.entries(style as Record<string, unknown>)
      assert.isAbove(props.length, 0, `s.${name} est vide`)
      for (const [prop, value] of props) {
        assert.isDefined(value, `s.${name}.${prop}`)
        assert.isNotNull(value, `s.${name}.${prop}`)
        if (typeof value === 'string') assert.notEqual(value.trim(), '', `s.${name}.${prop}`)
        if (typeof value === 'number') assert.isFalse(Number.isNaN(value), `s.${name}.${prop}`)
      }
    }
  })

  test('les composants du PDF ne référencent que des styles existants', async ({ assert }) => {
    const used = await referencedKeys('s')
    assert.isAbove(used.size, 0)
    const missing = [...used].filter((key) => !(key in s))
    assert.deepEqual(missing, [], `styles inconnus : ${missing.join(', ')}`)
  })

  test('les polices sont des polices PDF intégrées', ({ assert }) => {
    for (const [name, style] of Object.entries(s)) {
      const font = (style as { fontFamily?: string }).fontFamily
      if (font !== undefined) assert.oneOf(font, BUILTIN_FONTS, `s.${name}.fontFamily`)
    }
  })

  test('la page applique la marge PAGE_PAD et le bandeau la compense', ({ assert }) => {
    assert.equal(PAGE_PAD, 40)
    assert.include(s.page, {
      paddingHorizontal: PAGE_PAD,
      paddingTop: PAGE_PAD,
      color: C.dark,
      backgroundColor: C.white,
    })
    assert.include(s.pageHeader, {
      marginHorizontal: -PAGE_PAD,
      marginTop: -PAGE_PAD,
      paddingHorizontal: PAGE_PAD,
    })
  })

  test('les couleurs de la feuille proviennent de la palette ou sont des hex valides', ({
    assert,
  }) => {
    const palette = new Set<string>(Object.values(C))
    for (const [name, style] of Object.entries(s)) {
      for (const [prop, value] of Object.entries(style as Record<string, unknown>)) {
        if (!/color$/i.test(prop) || typeof value !== 'string') continue
        assert.isTrue(
          palette.has(value) || /^#[0-9a-f]{6}$/i.test(value) || value === 'transparent',
          `s.${name}.${prop} = ${value}`
        )
      }
    }
  })
})
