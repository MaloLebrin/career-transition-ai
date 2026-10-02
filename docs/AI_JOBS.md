# Jobs d’analyse IA (exercices)

Ce document décrit **comment le job d’analyse qualitative** est déclenché, comment le **déclencher à la main** depuis le code, et ce qu’il faut côté **queue** et **variables d’environnement**.

## Job concerné

| Fichier                                                                                           | Queue | Payload                        |
| ------------------------------------------------------------------------------------------------- | ----- | ------------------------------ |
| [`app/jobs/analyze_exercise_qualitative_job.ts`](../app/jobs/analyze_exercise_qualitative_job.ts) | `ai`  | `{ exerciseResultId: number }` |

Le job charge l’`ExerciseResult`, vérifie que le statut est **terminé** (`completed`), appelle le fournisseur IA configuré, puis enregistre le texte dans `exercise_results.qualitative_analysis`.

---

## 1. Déclenchement automatique (flux métier)

Aujourd’hui, le job est enfilé **sans action manuelle** lorsqu’un résultat d’exercice est sauvegardé en statut **complété** :

- Fichier : [`app/services/exercise_results_service.ts`](../app/services/exercise_results_service.ts) (`saveResult`)
- Condition : `input.status === exerciceResultStatusValues.COMPLETED`
- Appel :

```ts
await AnalyzeExerciseQualitativeJob.dispatch({
  exerciseResultId: resultRow.id,
}).toQueue('ai')
```

Les formulaires Inertia **candidat** et **conseiller** qui appellent `ExerciseResultsController` → `saveResult` déclenchent donc ce flux après validation.

### Politique B2C (#100)

Le `dispatch` est conditionné par `ExerciseAccessService.shouldRunAiAnalysis(employee, type, hasExistingAnalysis)` :

| Compte                                            | Analyse lancée ?                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| B2B (candidat d'un cabinet)                       | Toujours, à chaque résultat complété (inchangé)                                                          |
| B2C, forfait réglé                                | Toujours                                                                                                 |
| B2C, exercice gratuit (`B2C_FREE_EXERCISE_TYPES`) | **Une seule fois** : pas de relance si `qualitative_analysis` est déjà rempli                            |
| B2C, exercice verrouillé                          | Jamais (le contrôleur refuse d'ailleurs l'écriture ; déblocage au paiement, #104)                        |
| B2C, forfait réglé a posteriori                   | Au déblocage (#104), un job par exercice complété sans analyse (`EntitlementsService.onResultsUnlocked`) |

Le job notifie le conseiller (`ai_synthesis_ready`) **et**, pour un particulier B2C, le candidat lui-même (`ai_analysis_ready_candidate`, lien vers `/dashboard/candidat/exercises/:type`) : sans conseiller, personne d'autre ne lui relaierait l'information.

---

## 2. Déclencher le job manuellement (code serveur)

Depuis un **controller**, un **service**, une **commande Ace** ou un **script** qui s’exécute dans le contexte Adonis :

```ts
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'

// Remplace par l’id réel de la ligne exercise_results
await AnalyzeExerciseQualitativeJob.dispatch({
  exerciseResultId: 123,
}).toQueue('ai')
```

**À respecter :**

- La ligne `exercise_results` doit **exister**.
- Son `status` doit être **`completed`** au moment où le worker exécute le job (sinon le job se termine sans erreur mais **sans** mettre à jour l’analyse).
- Si tu dispatches **juste après** un `save()` en `completed`, l’ordre est bon : le worker lira la bonne ligne.

Tu peux encapsuler le même `dispatch` dans une **commande Ace** (`node ace make:command`) ou un script one-off booté avec l’app Adonis si tu veux un raccourci CLI.

---

## 3. Exécution du job : worker et `QUEUE_DRIVER`

### Mode `database` / `redis` (production ou worker séparé)

Les jobs enfilés ne s’exécutent que si un **worker** tourne :

```bash
node ace queue:work --queue=ai
```

Sans worker, les entrées restent dans la file (adapter database) jusqu’au traitement.

### Mode `sync` (dev / tests)

Si `QUEUE_DRIVER=sync` dans `.env`, le job s’exécute **immédiatement** dans le même processus que le `dispatch` (pas besoin de `queue:work`).

---

## 4. Configuration IA (`AI_PROVIDER`)

Le job utilise [`resolveAiTextCompletionProvider()`](../app/services/ai/resolve_ai_text_provider.ts) :

| `AI_PROVIDER`    | Prérequis         | Comportement                                                                            |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `mistral`        | `MISTRAL_API_KEY` | API Chat Completions Mistral (`MISTRAL_MODEL` optionnel, défaut `mistral-small-latest`) |
| `none` ou absent | —                 | Texte de substitution, **sans** appel réseau                                            |

En cas d’exception (clé invalide, réseau, etc.), le job enregistre un message d’erreur dans `qualitative_analysis` et log l’erreur.

---

## 5. Ce qui n’est **pas** ce job

Les écrans **ciblage**, **import CV** et **cartographie** appellent des endpoints serveur authentifiés (`POST /dashboard/ai/cv`, `/dashboard/ai/skill-mapping`, `/dashboard/ai/targets` — `AiAssistController`, `#services/ai_assist_service`, limités par `throttleAi` à 20/min par utilisateur) via [`inertia/helpers/ai`](../inertia/helpers/ai/index.ts). Ils utilisent les mêmes `AI_PROVIDER` / `MISTRAL_API_KEY` que le job (`createServerAiClient`) ; aucune clé n'est embarquée dans le bundle. Appels synchrones (hors queue), contrairement à `AnalyzeExerciseQualitativeJob`.

---

## Références

- [Documentation queues du projet](README.md#queues-adonisjs-postgresql) (`docs/README.md`)
- [Doc officielle AdonisJS — Queues](https://docs.adonisjs.com/guides/digging-deeper/queues)
