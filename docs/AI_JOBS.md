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

### Mode `sync` (déploiement sans worker)

Si `QUEUE_DRIVER=sync`, le job s’exécute dans le même processus que le `dispatch` (pas de `queue:work`). À l’enregistrement d’un exercice terminé, la requête **n’attend pas** la fin de l’appel IA : la redirection part tout de suite et l’analyse continue en arrière-plan. Le conseiller est notifié quand le texte est prêt.

En test (`app.inTest`), le `dispatch` est attendu pour rester dans la transaction de test.

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
