# 2026-10-05 — Page « Qui sommes-nous »

- **Routes.** `GET /qui-sommes-nous` (page Inertia `AboutUs`, groupe `guest()` des pages vitrine).
- **Contenu.** Mission, approche (exercices, IA copilote, expert), engagements (décision humaine,
  confidentialité, transparence), publics (particuliers, cabinets) et contact. Brouillon à relire.
- **Navigation.** Lien « Qui sommes-nous » dans `MARKETING_NAV` : header, menu mobile et colonne
  « Particuliers » du pied de page.
- **Tests.** `tests/inertia/pages/AboutUs.spec.tsx`, `tests/functional/public/public_pages.spec.ts`,
  `tests/inertia/config/marketing.spec.ts`.
