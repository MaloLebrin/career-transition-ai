# 2026-11-28 — PDF de synthèse et résultat d'exercice : durée, flèche du poste, date décalée

Trois défauts d'affichage relevés en relisant le PDF de synthèse et les pages de
résultat d'exercice du conseiller.

- **Durée lue comme des minutes (PDF).** `exercise_results.duration` est en
  secondes, mais le PDF écrivait `${duration} min` : un DISC de 2 min sortait en
  « 120 min ». Helper partagé `formatDurationSeconds` (`#shared/helpers/date`)
  — « 45 s », « 2 min », « 11 min 20 s » —, utilisé par le PDF et par la page
  de résultat du conseiller.
- **Flèche du poste illisible (PDF).** Les polices standard du PDF (Helvetica,
  WinAnsi) n'ont pas de glyphe « → », qui sortait en « ' ». Le poste visé est
  désormais séparé par « › » (`synthesisRoleText`, `ROLE_SEPARATOR`).
- **Date de passage décalée d'un jour (web).** La colonne `date` est sérialisée
  à minuit heure de Paris (`2024-06-02T00:00:00+02:00`) ; un navigateur à
  l'ouest de Paris l'affichait la veille. `formatDate` / `formatSessionDate`
  formatent dans `APP_TIME_ZONE` (`Europe/Paris`), comme `formatDateTimeFR` ;
  la page de résultat du conseiller réutilise le helper au lieu d'une copie
  locale, et la date courte du PDF suit le même fuseau.
- **Tests.** `tests/inertia/helpers/date.spec.ts` et la page `ResultDetail`
  (navigateur simulé en `America/Montreal`), `tests/unit/services/employee_synthesis_pdf/components.spec.ts`
  (séparateur, fuseau du serveur, garde : aucun glyphe hors WinAnsi dans les
  sources du PDF).
