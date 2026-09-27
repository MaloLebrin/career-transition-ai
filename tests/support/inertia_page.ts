import type { Assert } from '@japa/assert'
import type { ApiResponse } from '@japa/api-client'

/**
 * Épingle la page Inertia rendue (repris de boat-management).
 *
 * `@japa/api-client` délègue à superagent, qui **suit les redirections par
 * défaut**. Un GET protégé qui redirige vers `/auth/login` est donc suivi, et le
 * test reçoit un **200 Inertia parfaitement valide pour la page de login**.
 * `assertStatus(200)` passe, lire `inertiaProps` passe : seul l'épinglage du
 * composant rattrape le coup.
 *
 * `props` liste les props que le contrôleur doit envoyer : leur **présence** est
 * vérifiée avec `hasOwnProperty` — `assertInertiaPropsContains({ x: undefined })`
 * passerait même quand la clé est absente.
 */
export function assertPage(
  assert: Assert,
  response: ApiResponse,
  component: string,
  props: string[] = []
): Record<string, unknown> {
  response.assertStatus(200)
  response.assertInertiaComponent(component)

  const actual = response.inertiaProps as Record<string, unknown>
  const missing = props.filter((name) => !Object.prototype.hasOwnProperty.call(actual, name))
  assert.deepEqual(missing, [], `${component} : props manquantes — ${missing.join(', ')}`)

  return actual
}
