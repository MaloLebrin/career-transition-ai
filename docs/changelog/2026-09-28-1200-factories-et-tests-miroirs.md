# 2026-09-28 — Une factory par modèle, un test par service, contrôleur et helper

Plusieurs modèles n'avaient pas de factory, et une partie des services, contrôleurs,
helpers et constantes partagées n'avait pas de test dédié (seulement une couverture
indirecte via les tests functional).

- **Factories.** Ajout de `ContactRequestFactory`, `EmployeeSkillFactory` et
  `OnboardingTokenFactory` (états `expired` / `used`) : les 17 modèles ont désormais leur factory.
- **Services.** Tests unitaires pour `advisor_service`, `candidat_profile_service`,
  `onboarding_mail_service`, `pdf_export_events_service`, `notification_mail_service`,
  `null_ai_text_provider`, `console_mail_provider` et les styles du PDF de synthèse.
- **Contrôleurs.** Tests unitaires (service factice) pour les contrôleurs jusqu'ici couverts
  uniquement en functional : formations, expériences, compétences, notes, notifications,
  logo d'organisation, étapes du plan d'accompagnement, synthèses.
- **Helpers et `shared/`.** Tests Vitest pour les prompts IA par exercice (dont l'absence de
  nom/e-mail candidat), les prompts génériques et toutes les constantes partagées ; tests Japa pour
  `app/utils` et `app/mappers`.
- **Gardes.** `tests/unit/hygiene/model_factories.spec.ts` (une factory par modèle) et
  `tests/unit/hygiene/mirror_tests.spec.ts` (un test miroir par fichier source) font échouer
  `pnpm test` si un nouveau fichier arrive sans factory ou sans test.
