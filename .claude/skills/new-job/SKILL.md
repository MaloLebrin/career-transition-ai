---
name: new-job
description: Crée un job de queue @adonisjs/queue conforme au projet (queue nommée, retries, statuts, rétention, tests, docs). À utiliser pour tout traitement asynchrone (IA, PDF, analytics, e-mails).
---

# Nouveau job : $ARGUMENTS

Lis d'abord `docs/QUEUES.md`, `config/queue.ts` et un job existant
(`app/jobs/generate_employee_synthesis_pdf.ts`, `app/jobs/log_exercise_usage_export.ts`).

## Étapes

1. `node ace make:job <name>` → `app/jobs/<name>.ts`.
2. Payload typé (interface ; dans `shared/types/` si le front ou un service la réutilise).
3. Options :
   ```ts
   static options: JobOptions = { queue: QUEUE_NAMES.ai, maxRetries: 3 }
   ```
   Queue parmi `QUEUE_NAMES` (`#utils/queues/queue_names`) : `default`, `ai`, `pdfs`, `analytics`.
   Rétention : celle de `QUEUE_JOB_RETENTION` (`config/queue.ts`) — **jamais** `removeOnComplete: false`.
4. `execute()` idempotent (un retry ne doit rien dupliquer), logs via `logger` (jamais `console.log`,
   jamais de donnée candidat en clair). Appel IA → `pseudonymizeForAi`.
5. Si l'état est visible en UI : constantes de statut `as const` + contrainte `CHECK` + factory + seeder
   (modèle : `PdfExport`).
6. Dispatch depuis un **service** (pas un contrôleur) : `await MyJob.dispatch(payload)`.
7. Tests : `tests/unit/jobs/` (en test `QUEUE_DRIVER=sync`, le job tourne inline) — effet observable
   en base, cas d'échec. Les gardes `tests/unit/hygiene/queue_*.spec.ts` doivent rester vertes.
8. Docs : `docs/QUEUES.md` (ou `docs/AI_JOBS.md`), liste des jobs de `CLAUDE.md`, changelog.

## Vérification

```bash
pnpm test:db:up && pnpm test
pnpm dev:worker:all   # vérif manuelle
```
