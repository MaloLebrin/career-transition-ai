import type { Assert } from '@japa/assert'
import type { ApiResponse } from '@japa/api-client'

/**
 * Assertions sur les chemins d'erreur VineJS (repris de boat-management).
 *
 * ## Pourquoi ne pas utiliser `response.assertHasValidationError()`
 *
 * `@adonisjs/session/plugins/api_client` expose bien cette macro, mais elle lit
 * le flash **`errors`**, alors que le middleware de session range les erreurs de
 * validation dans **`inputErrorsBag`** — sac que le middleware Inertia relit
 * pour construire la prop `errors` des pages. La macro du plugin échoue donc
 * systématiquement.
 *
 * Asserter sur `inertiaErrors()` plutôt que sur la macro, c'est asserter
 * exactement le contrat que les formulaires React (`useForm`) consomment.
 */

/** Le sac d'erreurs par champ, tel que la page Inertia le recevra. */
export function inertiaErrors(response: ApiResponse): Record<string, string[]> {
  return (response.flashMessage('inputErrorsBag') ?? {}) as Record<string, string[]>
}

/**
 * La requête a été refusée par le schéma, et **exactement** sur les champs
 * attendus : avec un simple « contient », un payload cassé sur trois champs
 * passerait le test écrit pour un seul.
 */
export function assertFieldErrors(assert: Assert, response: ApiResponse, fields: string[]): void {
  response.assertStatus(302)
  assert.deepEqual(
    Object.keys(inertiaErrors(response)).sort(),
    [...fields].sort(),
    `erreurs de validation attendues sur ${fields.join(', ')}`
  )
}

/**
 * Aucune erreur de champ — l'assertion qui rend les précédentes non vacantes :
 * elle prouve que le payload de référence franchit bien le validateur.
 */
export function assertNoFieldErrors(assert: Assert, response: ApiResponse): void {
  assert.deepEqual(Object.keys(inertiaErrors(response)), [])
}
