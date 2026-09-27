import { test } from '@japa/runner'
import {
  formatDate,
  formatDateTimeFR,
  formatRelativeTime,
  formatSessionDate,
} from '#shared/helpers/date'

// Dates en milieu de mois et à midi UTC : le jour affiché ne dépend pas du fuseau.
const MID_MONTH = '2022-01-15T12:00:00.000Z'

test.group('formatDate', () => {
  test('renvoie un tiret pour une date absente', ({ assert }) => {
    assert.equal(formatDate(undefined), '—')
    assert.equal(formatDate(''), '—')
  })

  test('renvoie la chaîne telle quelle si elle ne se parse pas', ({ assert }) => {
    assert.equal(formatDate('bientôt'), 'bientôt')
  })

  test('formate en français selon les options', ({ assert }) => {
    assert.equal(formatDate(MID_MONTH, { month: 'long', year: 'numeric' }), 'janvier 2022')
    assert.equal(formatDate(MID_MONTH, { month: 'short', year: 'numeric' }), 'janv. 2022')
  })
})

test.group('formatSessionDate', () => {
  test('gère les valeurs absentes ou invalides', ({ assert }) => {
    assert.equal(formatSessionDate(undefined), '—')
    assert.equal(formatSessionDate('n/a'), 'n/a')
  })

  test('formate jour, mois long et année', ({ assert }) => {
    assert.equal(formatSessionDate(MID_MONTH), '15 janvier 2022')
  })
})

test.group('formatDateTimeFR', () => {
  test('gère les valeurs absentes ou invalides', ({ assert }) => {
    assert.equal(formatDateTimeFR(undefined), '—')
    assert.equal(formatDateTimeFR('demain'), 'demain')
  })

  test("affiche la date et l'heure de Paris", ({ assert }) => {
    // 12:00 UTC en janvier = 13:00 à Paris (UTC+1).
    const formatted = formatDateTimeFR(MID_MONTH)
    assert.include(formatted, '15 janvier 2022')
    assert.include(formatted, '13:00')
  })
})

test.group('formatRelativeTime', () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
  const MINUTE = 60_000

  test("moins d'une minute : « À l'instant »", ({ assert }) => {
    assert.equal(formatRelativeTime(ago(10_000)), "À l'instant")
  })

  test('en minutes sous une heure', ({ assert }) => {
    assert.equal(formatRelativeTime(ago(5.5 * MINUTE)), 'Il y a 5 min')
  })

  test('en heures sous un jour', ({ assert }) => {
    assert.equal(formatRelativeTime(ago(3.5 * 60 * MINUTE)), 'Il y a 3h')
  })

  test('en jours au-delà', ({ assert }) => {
    assert.equal(formatRelativeTime(ago(2.5 * 24 * 60 * MINUTE)), 'Il y a 2j')
  })
})
