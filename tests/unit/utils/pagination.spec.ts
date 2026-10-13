import { containsPattern, paginationMeta, whereAnyColumnContains } from '#utils/pagination'
import { test } from '@japa/runner'

test.group('pagination | paginationMeta', () => {
  test('reprend page, total et dernière page du paginateur', ({ assert }) => {
    assert.deepEqual(paginationMeta({ currentPage: 2, total: 51, lastPage: 3 }, 25), {
      page: 2,
      pageSize: 25,
      total: 51,
      lastPage: 3,
    })
  })
})

test.group('pagination | containsPattern', () => {
  test('entoure le terme de % et échappe les caractères spéciaux', ({ assert }) => {
    assert.equal(containsPattern('jean'), '%jean%')
    assert.equal(containsPattern('100%_a\\b'), '%100\\%\\_a\\\\b%')
  })
})

test.group('pagination | whereAnyColumnContains', () => {
  function fakeQuery() {
    const calls: Array<{ column: string; pattern: string }> = []
    let grouped = 0
    const query = {
      where(callback: (builder: unknown) => void) {
        grouped++
        callback({
          orWhereILike(column: string, pattern: string) {
            calls.push({ column, pattern })
          },
        })
        return query
      },
    }
    return { query, calls, groups: () => grouped }
  }

  test('ajoute un groupe OR ILIKE par colonne', ({ assert }) => {
    const { query, calls, groups } = fakeQuery()

    whereAnyColumnContains(query, ['name', 'email'], 'ma')

    assert.equal(groups(), 1)
    assert.deepEqual(calls, [
      { column: 'name', pattern: '%ma%' },
      { column: 'email', pattern: '%ma%' },
    ])
  })

  test('sans terme, la requête reste inchangée', ({ assert }) => {
    const { query, calls, groups } = fakeQuery()

    assert.strictEqual(whereAnyColumnContains(query, ['name'], ''), query)
    assert.equal(groups(), 0)
    assert.lengthOf(calls, 0)
  })
})
