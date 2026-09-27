# 2026-09-27 — Conventions et garde-fous repris de boat-management

Alignement sur les règles éprouvées de boat-management (même stack AdonisJS +
Inertia) : guidance des agents, outillage, et un premier refactor pilote.

- **Notes (pilote).** `NotesService` porte désormais les requêtes, le scoping
  organisation et les contrôles d'accès ; `NotesController` ne fait que valider,
  déléguer et rediriger. Erreurs métier dans `app/exceptions/note_errors.ts`.
  Changement visible : sur une requête Inertia, un refus (non-auteur, note
  introuvable, lien invalide) est flashé avec redirection au lieu d'un JSON brut
  affiché dans une modale. Hors Inertia, statut et `{ message }` inchangés.
- **Sécurité.** `OnboardingToken.token` n'est plus sérialisable (`serializeAs: null`).
- **Garde-fous.** Tests d'hygiène `controllers_thin` (cliquet sur les `.query(`
  dans les contrôleurs) et `secret_model_columns` ; helper `countQueries()`
  (`tests/utils/query_counter.ts`) pour les assertions anti-N+1.
- **Lint.** `<a href="/…">` interdit dans `inertia/` (utiliser `AppLink`),
  imports runtime de code serveur interdits dans `inertia/`, `max-lines` (300)
  en avertissement sur les composants.
- **Outillage.** Hook pre-commit husky + lint-staged (Prettier), `.prettierignore`,
  template de PR, `docs/process/pr-checklist.md`, ce changelog.
- **Agents.** CLAUDE.md complété ; agents (`reviewer`, `backend`, `frontend`,
  `tests`) et skills (`new-domain`, `add-field`, `new-job`, `new-inertia-page`)
  dans `.claude/`.
