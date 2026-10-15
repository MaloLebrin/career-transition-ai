# 2026-10-15 — Qui sommes-nous : les psychologues de l'équipe et des avis

La page `/qui-sommes-nous` restait abstraite : personne n'y était identifié et aucun
témoignage n'existait. Elle présente désormais les deux psychologues du travail qui portent
les accompagnements, et ce qu'en disent les personnes qui ont fait le parcours.

- **Contenu.** `shared/constants/team.ts` : `TEAM_MEMBERS` (prénom, nom, fonction, formation,
  parcours, spécialités) et `TESTIMONIALS` (citation, prénom et initiale, situation). Profils et
  avis sont des **illustrations provisoires** : `TEAM_CONTENT_IS_PLACEHOLDER` reste à `true`
  et une note le dit au visiteur (DESIGN.md §1, contenu honnête) ; aucun chiffre ni note en
  étoiles. Le PO remplace les textes puis passe le drapeau à `false`.
- **Composants.** `marketing/about/` : `TeamMonogram` (initiales sur disque teinté, pas de
  photo), `TeamMemberCard`, `TestimonialCard` (`figure` / `blockquote` / `figcaption`),
  `PlaceholderNotice` (`role="note"`).
- **Héros.** Le paysage à droite du titre laisse place à `TeamHeroCard` : les deux
  psychologues (monogramme, nom, fonction) et un renvoi vers `#equipe`, comme les cartes des
  héros de `/tarifs` et `/offre`.
- **Page.** Sections « L'équipe » (`#equipe`) et « Ils ont fait le point » (`#avis`) entre
  l'approche et les publics, tons alternés ; méta description mise à jour.
- **Accueil.** Bloc `TeamTeaser` (noms, fonctions, lien « Faire connaissance avec l'équipe »)
  entre les étapes et la confiance. Description du lien « Qui sommes-nous » du menu Ressources.
- **SEO.** `/qui-sommes-nous` ajouté à `SITEMAP_PATHS`.
- **Tests.** `tests/inertia/constants/team.spec.ts`, `components/marketing/about/*.spec.tsx`,
  `individuals/TeamTeaser.spec.tsx`, extensions de `pages/AboutUs.spec.tsx`,
  `IndividualsPage.spec.tsx`, `config/marketing.spec.ts`, `tests/unit/utils/seo.spec.ts`.
