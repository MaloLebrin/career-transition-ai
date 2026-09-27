import app from '@adonisjs/core/services/app'

/**
 * Vide la base entre deux tests, sans rejouer les migrations.
 *
 * `testUtils.db().truncate()` lance un `migration:run` avant *chaque* test :
 * autant de prises et de relâchements du verrou consultatif Postgres
 * (`pg_advisory_lock`). Le pool Lucid garde plusieurs connexions ouvertes ;
 * dès que la prise et le relâchement ne tombent pas sur la même,
 * `pg_advisory_unlock` renvoie `false` et Lucid lève « Migration completed,
 * but unable to release database lock » — puis chaque test suivant échoue de
 * la même façon.
 *
 * Les migrations sont déjà jouées une fois pour toutes par le hook global de
 * `tests/bootstrap.ts` : entre deux tests, seul le `db:truncate` est utile.
 *
 * S'utilise comme l'helper Lucid qu'il remplace — la fonction rendue est
 * exécutée par Japa au teardown du test :
 *
 * ```ts
 * group.each.setup(() => truncateDb())
 * ```
 */
export async function truncateDb(): Promise<() => Promise<void>> {
  const ace = await app.container.make('ace')

  return async () => {
    const command = await ace.exec('db:truncate', [])
    if (command.exitCode) {
      throw command.error ?? new Error('"db:truncate" failed')
    }
  }
}
